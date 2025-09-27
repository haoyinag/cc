# cmdcc

一句 `npm install -g cmdcc`，即可在 zsh / bash / WSL 等 Shell 中启用常用命令别名，并通过 `cc` 命令管理快捷资产。

## 快速开始
1. 安装：`npm install -g cmdcc`
2. 初始化：`cc setup`（postinstall 会自动执行一次；若发现别名缺失可手动重跑）
3. 查看资产：`cc list`
4. 重新打开终端或执行 `exec $SHELL`
5. 尝试命令：`pi`、`rdev`、`dcu`、`dcd` 等

## 内置快捷资产
安装或执行 `cc setup` 后，启用状态的脚本会复制到 `~/.config/cmdcc/` 并自动加载：

| 资产 ID | 来源文件              | 说明 |
| ------- | --------------------- | ---- |
| `pnpm`  | `pnpm-shortcuts.sh`   | 设置 `PNPM_HOME`、补全、`p`/`pi`/`rdev` 等别名 |
| `docker`| `docker-shortcuts.sh` | `dcu`/`dcd`/`dcr` 及项目扫描、fzf 选择等辅助 |

所有脚本均可自由修改；执行 `cc setup` 会重新复制并同步配置。禁用的资产会被自动清理。

## 配置与管理
- 默认配置保存在 `~/.config/cmdcc/config.json`：
  ```json
  {
    "version": 1,
    "enabledAssets": ["pnpm", "docker"],
    "shell": {
      "rcFiles": []
    }
  }
  ```
- `enabledAssets` 为显式启用列表（留空表示全部禁用）；未知 ID 会被忽略并发出警告。
- `shell.rcFiles` 可覆盖默认写入的 rc 文件列表，支持 zsh/bash 路径混用。

## `cc` 命令速览
```bash
cc setup            # 复制启用资产并写入 shell 初始化文件
cc remove           # 删除复制的脚本并清理注入段
cc status           # 查看配置目录、资产状态、rc 文件等信息
cc list             # 列出所有资产及启用状态
cc enable <id>      # 启用资产（写入配置后自动执行 setup）
cc disable <id>     # 禁用资产并自动清理脚本
cc help [command]   # 查看帮助或单条命令说明
```
> 支持 `rm` 作为 `remove` 的别名，`install` 作为 `setup` 的别名。

## 安装过程说明
执行安装脚本时会：
1. 拷贝已启用资产至 `~/.config/cmdcc/`，并清理禁用资产的旧文件。
2. 在目标 rc 文件（默认 `~/.zshrc`、`~/.bashrc`、`~/.bash_profile`）末尾追加管理块：
   ```sh
   # >>> cmdcc shortcuts start >>>
   if [ -d "$HOME/.config/cmdcc" ]; then
     for __cmdcc_file in "$HOME/.config/cmdcc/"*.sh; do
       [ -f "$__cmdcc_file" ] && . "$__cmdcc_file"
     done
     unset __cmdcc_file
   fi
   # <<< cmdcc shortcuts end <<<
   ```
   自定义 `configDir` 时，将写入对应绝对路径。
3. 清理旧版 `cmdsc`/`dcc`/`cmsc` 遗留的注入块与配置目录。

## 扩展
- 在仓库根目录新增 `.sh` 文件，并在 `lib/assets/registry.js` 中登记资产元数据，即可让 CLI 识别与管理。
- 更多架构细节与演进计划见 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)。
- 运行 `node scripts/run-tests.js` 可快速回归核心用例。

## 卸载
```bash
npm uninstall -g cmdcc
# 或
npm uninstall cmdcc
```
卸载会移除 `~/.config/cmdcc/` 与注入块，并清理旧版目录。
