# cmdsc (Command Shortcuts Center)

> 通过 npm 安装的一组跨终端 Shell 快捷脚本集合，当前内置 pnpm 与 Docker 常用别名，可在 zsh / bash / Linux / macOS / WSL 环境中复用。

## 功能
- 自动将仓库根目录下的 `.sh` 文件复制到 `~/.config/cmdsc/` 并在 shell 初始化时统一加载
- 内置 `pnpm-shortcuts.sh`、`docker-shortcuts.sh` 等别名脚本，可继续新增更多脚本按需扩展
- 自动检测旧版安装（`dcc`、`cmsc`）并清理遗留配置，避免重复注入
- 提供 `cc` CLI 命令，便于手动重新安装、查看状态、卸载

## 安装

```bash
npm install -g cmdsc
# 或在项目内局部安装
npm install cmdsc
```

安装脚本会自动完成：
1. 查找包内所有 `.sh` 文件并复制到 `~/.config/cmdsc/`
2. 在 `~/.zshrc`、`~/.bashrc`、`~/.bash_profile` 末尾写入以下代码块（仅一次，不重复追加）：

```sh
# >>> cmdsc shortcuts start >>>
if [ -d "$HOME/.config/cmdsc" ]; then
  for __cmdsc_file in "$HOME/.config/cmdsc/"*.sh; do
    [ -f "$__cmdsc_file" ] && . "$__cmdsc_file"
  done
  unset __cmdsc_file
fi
# <<< cmdsc shortcuts end <<<
```

完成后重新打开终端或执行 `exec $SHELL`，即可使用所有别名和函数。

## CLI 命令
安装后会得到 `cc` 命令：

```bash
cc setup       # 重新复制脚本并写入 shell 初始化文件
cc status      # 查看当前安装状态、脚本列表
cc remove      # 删除复制的脚本并清理注入的代码块
```

## 卸载

```bash
npm uninstall -g cmdsc
# 或项目内卸载
npm uninstall cmdsc
```

卸载时会自动清理 `~/.config/cmdsc` 与 shell 初始化文件中的注入块，同时兼容旧版 `dcc`/`cmsc` 残留。

## 开发与扩展
- 在仓库根目录新增其它 `.sh` 文件即可被安装脚本自动识别和加载
- 使用 `npm link`（建议结合 `npm config set prefix "$HOME/.npm-global"`）将当前包链接为全局命令，便于本地调试
- 发布前更新 `package.json` 的版本号、仓库地址，并运行 `npm publish --dry-run` 检查实际打包内容

欢迎继续补充更多常用快捷脚本，一次安装多终端共享。
