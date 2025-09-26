# cmdcc

一句 `npm install cmdcc`，即可在 zsh / bash / WSL 等 Shell 中启用常用命令别名，并附带 `cc` 辅助命令便于维护。

## 快速开始
1. 安装：`npm install -g cmdcc`
2. 初始化：`cc setup`（postinstall 会自动执行一次；若发现别名缺失可手动重跑）
3. 重新打开终端或执行 `exec $SHELL`
4. 尝试命令：`pi`、`rdev`、`dcu`、`dcd` 等

## 内置快捷命令
安装或执行 `cc setup` 后，包内所有 `*.sh` 会复制到 `~/.config/cmdcc/` 并自动加载：

- **pnpm 别名**（来自 `pnpm-shortcuts.sh`）
  - `p`、`pi`、`pl`、`pu`、`pd`、`pr`
  - `run`、`rdev`、`rstage`、`rprod`、`preview` 等常用脚本别名
- **Docker Compose 函数**（来自 `docker-shortcuts.sh`）
  - `dcu`：`docker compose up -d`，带项目选择器
  - `dcd`：`docker compose down`
  - `dcr`：`docker compose run ...`
  - 命令执行前会显示 “🔍 正在查找 …” 提示，默认最多向下遍历 4 层；如安装 fzf，将进入交互筛选模式。

你也可以添加自己的 `.sh` 文件，重新运行 `cc setup` 即可生效。

## 安装过程说明
执行安装脚本时会：
1. 拷贝包内 `*.sh` 至 `~/.config/cmdcc/`
2. 在 `~/.zshrc`、`~/.bashrc`、`~/.bash_profile` 末尾追加：
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
3. 清理旧版 `cmdsc`/`dcc`/`cmsc` 遗留的同类配置块

## `cc` 辅助命令
```bash
cc setup       # 重新复制脚本并写入 shell 初始化文件
cc status      # 查看当前安装状态、脚本列表及兼容目录
cc remove      # 删除复制的脚本并清理注入代码块
```

## 卸载
```bash
npm uninstall -g cmdcc
# 或
npm uninstall cmdcc
```
卸载会移除 `~/.config/cmdcc/` 与注入块，并清理旧版目录。

## 扩展
在仓库根目录放入更多 `*.sh` 文件，或在全局安装后修改 `~/.config/cmdcc/` 下的脚本，再执行 `cc setup`（或 `cc remove && cc setup`）即可更新快捷命令。
