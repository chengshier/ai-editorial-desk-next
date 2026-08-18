# DeepSeek Harness Integration

本目录只保存 AI Editorial Desk 对 DeepSeek Harness 的集成层，不 vendoring Harness upstream。

当前冻结原则：

- Harness = Product Runtime + Workbench Shell + Agent/Session/Tool/Job/Approval runtime。
- Editorial Intelligence Core 通过 API / tools 暴露给 Harness。
- 首选 out-of-tree plugin、profile、bundle、tool 与 capability seam；默认禁止 patch upstream core。
- Harness 处于 Developer Preview，必须 pin 版本/commit，并通过 compatibility adapter 隔离 breaking changes。
- Durable business truth 不写入 Harness session log 作为唯一存储；Session log 只保存交互与运行轨迹。

实现前阅读 `docs/03_ARCHITECTURE/HARNESS_INTEGRATION.md`。
