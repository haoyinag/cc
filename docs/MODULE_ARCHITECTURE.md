# 模块插件化草案

目标：让快捷模块具备可扩展、可配置、可复用的能力，同时避免破坏现有安装流程。

## Manifest 扩展
- 现有字段：`id`, `file`, `group`, `description`, `defaultEnabled`, `keywords`。
- 建议新增：
  - `version`: 语义化版本字符串，便于后续做兼容判断。
  - `platforms`: 数组，限定支持的操作系统/架构（如 `['darwin', 'linux']`）。
  - `requires`: string[]，声明依赖的其他模块 ID，安装时需确保依赖先启用。
  - `hooks`: object，可选字段，包含 `postInstall`, `preRemove`, `status` 等钩子脚本路径。
  - `config`: object，描述自定义配置项（默认值、类型、提示）。

## 模块生命周期
1. **启用**
   - 校验依赖与平台；若不满足给出警告并阻止启用。
   - 根据 manifest hooks 执行可选 `postInstall(ctx)`。
2. **禁用**
   - 调用 `preRemove(ctx)` 处理善后，允许返回清理路径列表。
3. **状态检查**
   - `status` 钩子返回额外诊断信息（如外部命令是否可用），CLI 在 `cc status` 中展示。

## CLI 调整
- `cc enable <id>` / `cc disable <id>`
  - 调用模块钩子并处理错误。
  - `enable` 支持 `--force`，忽略平台/依赖检查。
- 新增 `cc module info <id>` 命令，展示 manifest 全量信息及配置项。
- `cc list` 展示版本、依赖、平台信息。

## 配置交互
- 在 `config.json` 中新增 `modules` 节点：
  ```json
  {
    "modules": {
      "docker": {
        "enabled": true,
        "config": {
          "maxDepth": 4
        }
      }
    }
  }
  ```
- `enabledAssets` 可逐步废弃，改由 `modules.<id>.enabled` 控制；迁移逻辑需兼容旧字段。
- `cc config get/set` 将读取/写入对应模块配置。

## 实施步骤建议
1. **Manifest 升级**：扩展 `lib/assets/registry.js` 数据结构，提供 schema 校验。
2. **钩子加载器**：在 `lib/assets/` 下新增 `hooks/<id>.js`，通过动态 `require` 执行。
3. **setup 流程**：
   - 安装前解析 manifest 验证依赖。
   - 执行钩子并收集日志。
4. **CLI 命令更新**：增强 `list/enable/disable`，新增 `module info`。
5. **配置迁移**：`config.loadConfig` 检测旧格式自动转换，并提示用户。
6. **测试**：
   - 单元测试覆盖钩子执行、依赖校验。
   - 集成测试模拟模块配置读写。

## 风险与对策
- **依赖循环**：在启用流程做拓扑排序，检测循环并阻止。
- **钩子异常**：增加超时/错误捕获，避免影响核心安装流程。
- **配置膨胀**：鼓励模块自带默认值，`cc module info` 提供清晰说明。

该草案完成后，可据此实现第一批高级模块。继续迭代时再补充模板、示例与开发指南。
