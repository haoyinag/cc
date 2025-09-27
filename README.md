# cmdcc

cmdcc 可以让你的终端（zsh / bash / WSL 等）立刻拥有一组实用的命令别名。装好 Node.js 后只需一次安装，日常使用几乎不用再操心。

## 最快上手 4 步

1. 安装：`npm install -g cmdcc`
2. 关闭并重新打开终端（或执行 `exec $SHELL`）
3. 查看现成的快捷命令：`cc list`
4. 直接使用，例如 `pi`（= `pnpm install`）、`dcu`（= `docker compose up -d`）

> 安装时会自动执行一次 `cc setup`，一般不需要你手动运行。

## 日常只记住命令`cc help`

### `cc` 命令速览

```bash
cc setup            # 复制启用模块并写入 shell 初始化文件
cc remove           # 删除复制的脚本并清理注入段
cc status           # 查看配置目录、模块状态、rc 文件等信息
cc list             # 列出所有模块及启用状态
cc enable <id>      # 启用模块（写入配置后自动执行 setup）
cc disable <id>     # 禁用模块并自动清理脚本
cc help [command]   # 查看帮助或单条命令说明
```

> 支持 `rm` 作为 `remove` 的别名，`install` 作为 `setup` 的别名。

如果别名失效，重新执行 `cc setup` 即可修复。

## 目前包含的快捷命令包

- **pnpm 包**：`p`、`pi`、`rdev` 等常用别名，自动处理 `PNPM_HOME`
- **docker 包**：`dcu`、`dcd`、`dcr` 等常用组合，带项目目录扫描（支持 fzf）

更多包将陆续上线，届时会通过更友好的界面让你启用/停用。目前保持默认即可。

## 需要更深入？

- 进阶设计、路线图和开发笔记都在 `docs/` 目录，仅供有定制需求或想贡献代码的朋友参考。
- 项目作者可运行 `node scripts/run-tests.js` 进行快速自检。

## 卸载

```bash
npm uninstall -g cmdcc
```

卸载时，cmdcc 会清理掉复制的脚本和在 Shell 中写入的内容。
