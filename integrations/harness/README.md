# DeepSeek Harness Integration

本目录只保存 AI Editorial Desk 对 DeepSeek Harness 的集成层，不 vendoring Harness upstream。

## 冻结原则

- Harness = Product Runtime + Workbench Shell + Agent/Session/Tool/Job/Approval runtime。
- Editorial Intelligence Core 通过 API / tools 暴露给 Harness。
- 首选 out-of-tree plugin、profile、bundle、tool 与 capability seam；默认禁止 patch upstream core。
- Harness 处于 Developer Preview，必须 pin version/commit，并通过 compatibility adapter 隔离 breaking changes。
- Durable business truth 不以 Harness Session log 作为唯一存储；Session 只保存交互/运行/replay 所需事实。

实现前阅读：
- `docs/03_ARCHITECTURE/HARNESS_INTEGRATION.md`
- `docs/03_ARCHITECTURE/HARNESS_RUNTIME_TOPOLOGY.md`
- `docs/04_CONTRACTS/HARNESS_API_CONTRACT.md`
- `docs/07_DELIVERY/HARNESS_INTEGRATION_SPIKE.md`

## Phase 0.5-A Pin

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

Pin 只用于让 Spike 兼容结论可复现，不代表永久锁版本。

## Spike package

```text
integrations/harness/
├─ HARNESS_PIN.json
├─ README.md
├─ scripts/prepare_spike.py
└─ spike-package/
   ├─ package.json
   ├─ tsconfig.json
   ├─ tsdown.config.ts
   ├─ cordis.patch.yml
   └─ src/
      ├─ index.ts
      ├─ events.ts
      └─ client/index.ts
```

Package 会在验证时复制进独立 pinned Harness checkout 以完成 exact-pin build；运行时必须再通过官方 `dsh plugin --profile web add ...` 安装到选定 profile。复制到 upstream workspace 不是运行时安装。

## 本地执行：必须保持与 CI 相同顺序

### 1. 启动 Editorial API

Next 仓库根目录：

```bash
python -m pip install -e '.[dev]'
python -m uvicorn apps.editorial_api.main:app --host 127.0.0.1 --port 8000
```

Spike Backend 只提供 mock Opportunity/Research API，不建立正式业务表。

### 2. checkout exact pin 并先构建 pristine Harness

```bash
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
git checkout 99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
corepack enable
corepack prepare pnpm@11.7.0 --activate
pnpm install --frozen-lockfile
pnpm run build
```

**顺序不能倒置。** 完整 Web profile 启动需要 pristine pinned Harness 的 root build 产物；仅执行 `build:lib:host` 不足以证明 Web runtime 可启动。

### 3. 准备 out-of-tree spike package

回到 Next 仓库：

```bash
python integrations/harness/scripts/prepare_spike.py /path/to/deepseek-harness
```

脚本会拒绝非 pinned commit，并只允许覆盖自身 `@ai-editorial-desk/harness-spike` 临时目录。

### 4. reconcile / typecheck / bundle

在 Harness 根目录：

```bash
pnpm install --no-frozen-lockfile
pnpm exec tsc -b packages/client/editorial-spike/tsconfig.json
pnpm --filter @ai-editorial-desk/harness-spike run bundle
```

预期：

```text
packages/client/editorial-spike/lib/index.js
packages/client/editorial-spike/lib/client.js
packages/client/editorial-spike/lib/types/index.d.ts
packages/client/editorial-spike/lib/types/client/index.d.ts
```

### 5. 安装到隔离 Web profile

```bash
export DSH_HOME="$PWD/.dsh-spike-home"
pnpm dsh plugin --profile web add ./packages/client/editorial-spike
```

Spike package 通过 `dsh.bundle.patch` 加入 profile composition；无需 fork/patch Harness core，也不使用临时 `--patch` 绕过 profile 生命周期。

### 6. 启动 Harness Web

```bash
export DSH_HOME="$PWD/.dsh-spike-home"
EDITORIAL_API_BASE_URL=http://127.0.0.1:8000 \
pnpm dsh web
```

默认 Web 地址：`http://127.0.0.1:3080`。

如果只验证 Tool runtime，不需要模型即可由集成测试使用 Harness 的 `ctx.tools.execute()`；如果验证“自然语言 → Agent 自动选择 Tool”，则仍需按 Harness 官方方式配置可用模型。API Key 不写入仓库。

## 当前自动化已经证明

```text
pristine exact-pin full build
→ out-of-tree profile/plugin activation
→ FastAPI + Harness Web boot
→ Harness ctx.tools.execute(list/inspect/error)
→ Editorial Tool → FastAPI
```

自动化证明的是 runtime integration，不是最终产品 UX。

## 仍需真实浏览器/Agent 验证

- Model 是否稳定选择 Editorial Tools；
- Opportunity Card 的实际信息密度与可读性；
- Research Job live progress；
- Research Conversation Node；
- Session refresh/replay；
- error/cancel UX；
- Radar/Programming/Performance 等复杂业务 UI。

这些项目未实测前，不得把 `HARNESS_FULL_WORKBENCH` 写成 Accepted。
