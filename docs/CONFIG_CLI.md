# `cc config` 交互草案

## 命令结构
```
cc config get [path]
cc config set <path> <value>
cc config unset <path>
cc config edit
cc config path
```
- `path` 采用点号语法（如 `modules.docker.enabled`）。
- 支持 `--json` 输出原始 JSON。

## 行为定义
### cc config get [path]
- 无 `path` 时输出完整配置（默认格式化展示，可加 `--json` 返回原始 JSON）。
- 指定 `path` 时读取对应值，若不存在返回提示并以非 0 退出。

### cc config set <path> <value>
- 自动推断 value 类型：`true/false/null` 转换为布尔/空值，纯数字转换为 Number，其余视为字符串。
- 若路径不存在则递归创建对象节点。
- 写入前备份旧配置到 `config.json.bak`。
- 设置成功后提示用户重新执行 `cc setup`（若修改涉及模块启停可直接触发）。

### cc config unset <path>
- 删除指定路径；若结果导致空对象则自动清理。
- 删除成功后提示是否需要重新 setup。

### cc config edit
- 打开系统默认编辑器（`$EDITOR` 环境变量）。
- 编辑完成后执行 JSON 校验，失败则恢复备份并提示错误位置。

### cc config path
- 输出当前使用的配置文件绝对路径。

## 实现要点
- 在 `lib/config.js` 内新增解析/序列化工具：
  - `get(config, path)` / `set(config, path, value)` / `unset(config, path)`。
  - 新增 `backupConfig(configDir)` 与 `restoreBackup(configDir)`。
- 新增 `lib/commands/config/` 子命令模块，复用现有命令注册体系。
- `enable/disable` 命令迁移到调用 `config set` 逻辑，保持单一来源。

## 错误处理
- 对 JSON 解析失败、权限不足等情况返回 `CliError`，并附带建议（例如使用 `sudo`）。
- 写入时使用原子方式（先写入临时文件，再 rename）。

## 后续扩展
- 支持 `cc config import/export <file>`。
- 允许模块定义自有 schema，与 `config get/set` 联动校验。

该草案可作为后续实现 `cc config` 系列命令的基础说明文档。
