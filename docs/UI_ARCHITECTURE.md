# UI 架构草案

## 技术栈
- 容器：Tauri（Rust + WebView），Electron 作为备选
- 前端：React + Vite + TypeScript
- 组件库：Material UI（默认主题 + 可选赛博朋克皮肤）
- 状态管理：Zustand + React Query（或 RTK Query）用于消费 daemon API
- 样式：MUI Emotion + 自定义主题切换

## 页面结构
1. **Dashboard**
   - Shell 状态卡片：配置路径、RC 检测、最近执行结果
   - 快捷操作：`重新安装 (setup)`、`执行自检 (doctor)`、`清理 (remove)`
   - 模块概览：启用/禁用总数、异常模块提醒
2. **模块管理**
   - 列表（DataGrid）：模块名、描述、分组、状态、依赖
   - 详情抽屉：别名列表、外部依赖检测结果、最近日志、启停开关
   - 搜索/筛选：按分组、状态
3. **日志视图**
   - 时间轴展示 daemon 操作日志
   - 支持关键字过滤、复制、导出
4. **设置页**（MVP 简化）
   - 配置文件只读视图（JSON Viewer）
   - rc 文件列表与打开按钮
   - 后续扩展：主题切换、API Token 配置

## 模块结构
```
packages/ui
 ├── src
 │   ├── main.tsx          # React 入口
 │   ├── app/App.tsx       # 路由框架
 │   ├── api/client.ts     # Daemon API 客户端（axios/fetch）
 │   ├── store/useState.ts # Zustand store（全局状态）
 │   ├── components/       # 可重用组件
 │   ├── pages/
 │   │   ├── Dashboard/
 │   │   ├── Modules/
 │   │   ├── Logs/
 │   │   └── Settings/
 │   └── theme/
 │       ├── index.ts      # MUI 主题定义
 │       └── cyberpunk.ts  # 赛博朋克主题配置
 ├── public/
 ├── package.json
 └── tauri.conf.json
```

## 数据流
- 所有数据通过 daemon API 获取
- React Query 负责缓存与刷新；Mutation 用于启停模块和触发操作
- 异常处理统一封装（toast + 对话框提示）

## 上云准备
- API 客户端支持自定义 baseURL（本地 vs 云端）
- 鉴权 Token 管理（存储于安全位置）
- 提供一键导出配置、日志的入口

## MVP 待办
- [ ] 搭建 Tauri + Vite + React 工程，配置 TS/MUI
- [ ] 实现 API 客户端、错误处理器
- [ ] 完成 Dashboard/Modules/Logs 基础界面
- [ ] 与 daemon API 打通，支持启停模块、运行 setup/doctor
- [ ] 添加主题切换（默认 + 赛博朋克）
- [ ] E2E 冒烟测试脚本（Playwright）

## 后续规划
- 配置表单化编辑、模块详情扩展
- 模块商店/插件市场视图
- 多设备同步（云端 daemon）与账号体系
