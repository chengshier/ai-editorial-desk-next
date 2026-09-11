# Phase 0.5-B E5-A — 中文平台热榜真实运行审计

## 状态

`PUBLIC_DEMO_UNAVAILABLE / SELF_HOST_RETRY_REQUIRED`

本轮目标是验证中文平台热榜是否能作为 `DISCOVERY_SIGNAL + TREND_SIGNAL` 的 no-key snapshot baseline。该轮使用 NewsNow 聚合层读取微博、抖音、知乎、B 站热搜，不把热榜排名解释为长期速度，也不把热榜项升级为 Evidence。

## 1. 真实运行参数

```text
mission_count   1
mission_id      momentum-search-attention-surge
platform_count  4
platforms       weibo / douyin / zhihu / bilibili-hot-search
max_results     10
```

## 2. 真实结果

4 个平台均返回 `UNAVAILABLE`：

```text
weibo                 HTTP 403
Douyin                HTTP 403
Zhihu                 HTTP 403
Bilibili hot search   HTTP 403
```

因此：

```text
retrieved_count                 0 / 4 providers
DISCOVERY_SIGNAL observed       0
TREND_SIGNAL observed           0
required SourceRole satisfied   0 / 4
```

这不是“微博 / 抖音 / 知乎 / B 站没有热榜能力”，而是本次默认使用的公共 NewsNow demo endpoint：

```text
https://newsnow.busiyi.world/api/s
```

对当前真实请求统一返回 403。

## 3. 不应做的错误结论

本轮不能据此得出：

```text
微博热榜不可用
抖音热榜不可用
知乎热榜不可用
B 站热搜不可用
```

唯一可以确认的是：

```text
public NewsNow demo instance
!= reliable benchmark / production dependency
```

公开 demo 的可用性、限流、访问控制与部署策略不属于平台能力本身。

## 4. 架构纠正

NewsNow 上游支持自部署，并提供 Docker Compose。当前 Spike 已保留 `NEWSNOW_API_BASE` / `--api-base`，因此不需要改变 Provider contract，只需要把实例边界改正确：

```text
Public demo
→ probe-only / explicit opt-in

Self-hosted NewsNow
→ controlled E5-A benchmark seam
```

代码已修改：

```text
NewsNowHotlistProvider default api_base
https://newsnow.busiyi.world/api/s
→ http://127.0.0.1:4444/api/s

run_platform_hotlist_baseline default
→ local/self-hosted NewsNow
```

这避免未来误把第三方公共 demo 的 403 当成微博/抖音平台 capability failure。

## 5. Self-host Retry Protocol

NewsNow 上游 Docker Compose 默认暴露：

```text
localhost:4444
```

本地启动后先验证：

```text
http://127.0.0.1:4444/api/s?id=weibo&latest
```

再运行：

```powershell
.\.venv\Scripts\python.exe -m benchmarks.acquisition.run_platform_hotlist_baseline `
  --mission momentum-search-attention-surge `
  --max-results 10 `
  --output .local-benchmark\phase-0.5b-e5a-platform-hotlist-selfhost.json
```

若自部署实例仍无法获取某平台，则该失败才进入 NewsNow source / platform-source compatibility 审计。

## 6. E5-B 不等待全平台成功

E5-A 的目的只是建立热榜 snapshot baseline。即使部分 NewsNow source 后续失败，E5-B 仍按独立 capability seam 推进：

```text
official / authorized platform item
+ author
+ published_at
+ metrics snapshot with observed_at
```

优先验证官方/授权能力，不用抓取绕过方式替代官方 seam。

## 7. 下一 Gate

1. 使用自部署 NewsNow 重跑 4 平台 E5-A；
2. 记录每个平台真实返回、rank、URL provenance、跨平台重复；
3. 同时推进 E5-B 官方 platform-item / metrics seam；
4. 将 Hotlist Trend Signal 与 Exa/Firecrawl 背景补全合并，再补做 Momentum Human Acceptance；
5. 完成 capability matrix 后进入 0.5B-F Provider Decision + ADR。
