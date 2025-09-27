# 下一批快捷模块候选清单

## 1. git-pro
- **定位**：提升日常 Git 操作效率，封装常用 alias 与工具。
- **功能建议**：
  - `gco`, `gcm`, `gst`, `gdf` 等 alias。
  - 自动检测并加载 `git status --short` 彩色输出配置。
  - 可选集成 `tig` / `lazygit` 启动命令。
- **验收标准**：
  - 允许用户通过配置开启/关闭交互式工具。
  - 至少包含 10 个高频命令别名并提供帮助注释。
  - 通过测试验证 alias 注入无冲突。

## 2. node-toolbox
- **定位**：Node 项目维护工具集，统一管理 `npx`, `npm-check`, `lint`, `test` 别名。
- **功能建议**：
  - `ntest`, `nlint`, `nfix` 等命令。
  - 自动探测 `nvm`/`fnm`，提示用户切换 Node 版本。
  - 可选执行 `npm audit`/`pnpm audit` 快捷命令。
- **验收标准**：
  - 支持 pnpm/npm/yarn 三种包管理器，至少兼容两种。
  - 提供配置项控制是否启用 audit 相关命令。
  - 附带文档说明示例输出。

## 3. k8s-helper
- **定位**：辅助 Kubernetes 日常操作，封装 `kubectl` 与 `k9s` 相关命令。
- **功能建议**：
  - `kctx`, `kns`, `kpods`, `klogs` 快捷函数。
  - 自动补全配置（若安装 `kubectl` completion）。
  - 支持 `kubectl` context 列表交互选择（fzf）。
- **验收标准**：
  - 未安装 kubectl 时需优雅降级并提示安装命令。
  - fzf 相关功能可配置开关。
  - 提供 Smoke Test 覆盖 context 切换逻辑。

## 4. cloudctl
- **定位**：常见云服务 CLI（AWS/GCP/Azure）启动器与环境准备工具。
- **功能建议**：
  - 检测 `aws`, `gcloud`, `az` 命令是否存在。
  - 快速切换 profile/项目别名（如 `aws-switch profileName`）。
  - 统一日志输出与凭证目录提示。
- **验收标准**：
  - 未检测到相关 CLI 时输出提示而非报错。
  - 提供跨平台环境变量配置示例。
  - 文档列出所需权限与安全注意事项。

## 实施节奏建议
1. 先落地 git-pro 与 node-toolbox，确保模块化流程可复用。
2. 再实现 k8s-helper，引入外部命令检测与交互逻辑。
3. cloudctl 可能涉及敏感配置，安排在安全策略确定后执行。

## 验收流程
- 每个模块附带 README 或注释说明：用途、依赖、配置项。
- 添加针对模块的最小集成测试（至少验证函数被加载）。
- 在主文档 `README.md` 更新模块一览表与启用方式。
