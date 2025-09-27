# cmdcc Web UI 快速开始

1. **启动 daemon**
   ```bash
   npm install
   npm run daemon
   ```
   默认监听 `http://localhost:3777`，如需自定义端口可设置 `CMDCC_PORT` 环境变量。

2. **启动前端（开发模式）**
   ```bash
   cd packages/ui
   npm install
   npm run dev
   ```
   浏览器访问 `http://localhost:4576`。

3. **打包（实验阶段）**
   ```bash
   npm run build
   ```
   构建输出位于 `packages/ui/dist`，后续将接入 Tauri 生成桌面应用。

4. **主要视图**
   - Dashboard：显示配置状态、自检按钮、快捷操作
   - Modules：启停模块、查看依赖
   - Logs：查看最新操作日志（需 daemon 运行）

5. **注意事项**
   - 当前版本为 MVP，尚未启用鉴权；如需保护接口，请设置 `CMDCC_TOKEN` 环境变量。
   - 若 daemon 报错，可检查日志并根据提示处理权限问题。
   - 为了支持云端部署，API 设计遵循 REST 风格，后续可通过反向代理或 HTTPS 暴露。
