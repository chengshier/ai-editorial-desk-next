# DeepSeek Harness Integration

本目录只保存 AI Editorial Desk 对 DeepSeek Harness 的集成层，不 vendoring Harness upstream。

## 冻结原则

- Harness = Product Runtime + Workbench Shell + Agent/Session/Tool/Job/Approval runtime。
- Editorial Intelligence Core 通过 API / tools 暴露给 Harness。
- 首选 out-of-tree plugin、profile、bundle、tool 与 capability seam；默认禁止 patch upstream core。
- Harness 处于 Developer Preview，必须 pin 版本/commit，并通过 compatibility adapter 隔离 breaking changes。
- Durable business truth 不写入 Harness session log 作为唯一存储；Session log 只保存交互与运行轨迹。

实现前阅读：
- `docs/03_ARCHITECTURE/HARNESS_INTEGRATION.md`
- `docs/03_ARCHITECTURE/HARNESS_RUNTIME_TOPOLOGY.md`
- `docs/04_CONTRACTS/HARNESS_API_CONTRACT.md`
- `docs/07_DELIVERY/HARNESS_INTEGRATION_SPIKE.md`

## Phase 0.5-A 当前 Pin

见 `HARNESS_PIN.json`。当前 Spike 固定：

```text
DeepSeek Harness commit
99f6f02fecdb7dff40c3fbc9470f5907c29f74ca

dsh release
0.1.0-rc.7

Node
22.19.0

pnpm
11.7.0
```

Pin 的目的不是永久锁版本，而是让 Spike 的兼容性结论可复现。

## Spike 目录

```text
integrations/harness/
├─ HARNESS_PIN.json
├─ README.md
├─ scripts/
│  └─ prepare_spike.py
└─ spike-package/
   ├─ package.json
   ├─ tsconfig.json
   ├─ tsdown.config.ts
   ├─ cordis.patch.yml
   └─ src/
      ├─ index.ts              # Host: Tools + Jobs + FastAPI client
      ├─ events.ts             # Durable research session events
      └─ client/index.ts       # Web: replayable Research Conversation Node
```

该 package 会在验证时复制进 **独立的 pinned Harness checkout** 以完成 exact-pin 编译；本仓库不提交 Harness 源码。运行时还必须通过 Harness 官方 profile plugin seam 安装到实际使用的 profile，不能把“复制进 upstream workspace”误当成运行时安装。

## 本地执行

### 1. 启动 Editorial API

在 `ai-editorial-desk-next` 根目录：

```bash
python -m pip install -e .
python -m uvicorn apps.editorial_api.main:app --host 127.0.0.1 --port 8000
```

Spike Backend 只提供 mock Opportunity/Research API，不建立正式 Subject/Opportunity 数据表。

### 2. 准备 exact-pin Harness

另一个目录：

```bash
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
git checkout 99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
```

回到 Next 仓库，执行：

```bash
python integrations/harness/scripts/prepare_spike.py /path/to/deepseek-harness
```

脚本会拒绝非 pinned commit，并只允许覆盖自身的 `@ai-editorial-desk/harness-spike` 临时目录。

### 3. 构建 Harness Spike

在 DeepSeek Harness 根目录：

```bash
corepack enable
corepack prepare pnpm@11.7.0 --activate
pnpm install --no-frozen-lockfile
pnpm run build:lib:host
pnpm exec tsc -b packages/client/editorial-spike/tsconfig.json
pnpm --filter @ai-editorial-desk/harness-spike run bundle
```

预期产生：

```text
packages/client/editorial-spike/lib/index.js
packages/client/editorial-spike/lib/client.js
packages/client/editorial-spike/lib/types/index.d.ts
packages/client/editorial-spike/lib/types/client/index.d.ts
```

### 4. 安装到隔离的 Harness Web Profile

Pinned Harness 的 profile loader 以 profile 目录为 out-of-tree dependency 的解析锚点。因此 Spike package 必须通过官方 `dsh plugin` seam 安装到 profile。

为避免污染开发机已有 Harness 配置，Spike 使用独立 `DSH_HOME`：

```bash
export DSH_HOME="$PWD/.dsh-spike-home"
pnpm dsh plugin --profile web add ./packages/client/editorial-spike
```

Spike package 声明：

```json
{
  "dsh": {
    "bundle": {
      "patch": "./cordis.patch.yml"
    }
  }
}
```

因此 `dsh plugin` 在安装完成后会把 `@ai-editorial-desk/harness-spike` 同时加入 Web profile 的 dependency 与 bundle layer。无需再通过临时 `--patch` 参数绕过 profile 生命周期。

### 5. 启动 Harness Web

保持同一个 `DSH_HOME`：

```bash
export DSH_HOME="$PWD/.dsh-spike-home"
EDITORIAL_API_BASE_URL=http://127.0.0.1:8000 \
pnpm dsh web
```

默认 Web 地址为 `http://127.0.0.1:3080`。如需通过自然语言让 Agent 自动调用 Tool，按 Harness 官方方式配置可用模型；API Key 不写入本仓库。

## 本轮要验证的真实交互

### A. Tool → FastAPI

在 Harness 中要求 Agent：

```text
列出今天已经发现的编辑机会。
```

应调用：

```text
list_editorial_opportunities
→ GET /api/v1/spike/opportunities
```

随后可以要求：

```text
详细看看洗碗机这条为什么值得做。
```

应调用 `inspect_editorial_opportunity`，并保留 canonical `opportunity_id`。

### B. Tool Card

List/Inspect 的 Tool result 应显示结构化业务卡片，而不是要求 UI 或 Agent 从自然语言中解析 id。

### C. Research Job + Replay

要求：

```text
继续研究洗碗机这条，补主要来源、反方证据和未知项。
```

应形成两种不同 identity：

```text
Backend research_case_id = canonical research business id
Harness job_id           = runtime task id
```

Session 中产生：

```text
editorial/research-start
editorial/research-progress
editorial/research-end
```

Web Conversation Node 根据这些 durable events 重建研究卡。需要人工验证：运行中进度、完成态、刷新/重新打开后的 replay 是否一致。

## 自动化边界

`.github/workflows/harness-spike.yml` 会对 exact pinned upstream 执行：

```text
copy package for exact-pin build
→ pnpm install
→ TypeScript project build
→ host/client bundle
→ artifact assertion
→ official dsh plugin --profile web add
→ isolated Web profile activation assertion
→ FastAPI + Harness Web profile boot smoke
```

自动化通过只证明 **编译/打包/profile 安装/Host 启动边界兼容**。以下仍需要真实 Web/Agent 人工验收后才能写 PASS：

- Model 是否能稳定选择三个 Editorial Tools；
- Opportunity Card 的实际可用性；
- Research Conversation Node 的 live progress；
- Session refresh/replay；
- Radar/复杂业务页面的扩展能力。

禁止在这些项目未真实验证前把 Spike 总结写成 PASS。
