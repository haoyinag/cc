# cmdcc Daemon API 说明

统一的 cmdcc daemon 提供 REST 接口，供 CLI、桌面 UI 等前端调用。本文件描述 MVP 阶段的接口与响应格式。

## 基础信息
- 服务启动命令：`npm run daemon`
- 默认监听端口：`3777`（可通过环境变量 `CMDCC_PORT` 调整）
- 响应采用 JSON；错误返回 HTTP 状态码 + `{ error: { code, message, details? } }`

## 端点列表

### GET /state
返回当前环境与模块状态。

**示例响应**
```json
{
  "configPath": "/Users/foo/.config/cmdcc/config.json",
  "configValid": true,
  "rcFiles": [
    { "path": "/Users/foo/.zshrc", "exists": true }
  ],
  "modules": [
    {
      "id": "pnpm",
      "enabled": true,
      "description": "PNPM shortcuts, PATH setup and completions.",
      "group": "node",
      "dependencies": [],
      "health": {
        "commandAvailable": true,
        "warnings": []
      }
    }
  ],
  "logs": []
}
```

### POST /modules/:id/enable
启用指定模块，随后执行 `setup.install`。如模块已启用，则返回 200 且状态不变。

**请求体**：可选 `{ "force": false }`，之后用于忽略平台检查。

**响应**：
```json
{
  "status": "enabled",
  "moduleId": "pnpm",
  "summary": {
    "copied": ["/Users/foo/.config/cmdcc/pnpm-shortcuts.sh"],
    "rcUpdated": [
      { "rcPath": "/Users/foo/.zshrc", "status": "updated" }
    ]
  }
}
```

### POST /modules/:id/disable
禁用模块，执行 `setup.install` 以清除脚本。

```json
{
  "status": "disabled",
  "moduleId": "pnpm",
  "summary": {
    "pruned": ["/Users/foo/.config/cmdcc/pnpm-shortcuts.sh"],
    "rcUpdated": []
  }
}
```

### POST /actions/setup
重新执行安装流程（等价于 CLI `cc setup`）。

**响应**：同 `setup.install` 返回值，附加 `status: "completed"`。

### POST /actions/remove
执行卸载逻辑（等价于 `cc remove`）。

```json
{
  "status": "completed",
  "summary": {
    "removed": ["/Users/foo/.config/cmdcc/pnpm-shortcuts.sh"],
    "rcUpdated": []
  }
}
```

### POST /actions/doctor
触发环境自检，MVP 提供以下检查：
- 配置文件可读、已备份
- Shell RC 是否存在并包含 cmdcc 标记
- 各模块依赖命令是否就绪

**示例响应**
```json
{
  "status": "ok",
  "checks": [
    { "id": "config-integrity", "result": "pass" },
    { "id": "rc-files", "result": "warn", "details": "~/.bashrc 缺少标记" }
  ]
}
```

### GET /logs
返回最近 N 条操作日志（默认 50）。

```json
{
  "logs": [
    { "timestamp": "2024-04-21T10:00:00.000Z", "message": "setup.install completed", "level": "info" }
  ]
}
```

## 错误码约定
| Code | 场景 | 建议处理 |
| --- | --- | --- |
| `module:not-found` | 模块 ID 不存在 | UI 提示用户刷新列表 |
| `module:disabled` | 模块未启用但请求 disable | 直接反馈提示 |
| `config:invalid` | 配置解析失败且无法修复 | 引导用户手动检查 |
| `fs:permission` | 写文件权限问题 | 提示用户以管理员权限运行 |

## 日志策略
- Daemon 维护内存日志（最长 200 条）
- 关键操作写入控制台，便于 `npm run daemon` 监控
- 后续可扩展到文件持久化或外部观察者

## 安全考虑
- 本地模式默认无需鉴权
- 预留 `CMDCC_TOKEN` 环境变量，若设置则所有请求需携带 `Authorization: Bearer <token>`
- 上云部署时需结合 HTTPS 和认证体系
