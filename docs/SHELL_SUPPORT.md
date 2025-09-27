# Shell 扩展实施方案

本文细化 fish 与 PowerShell 支持计划，便于后续迭代时直接落地。

## fish 支持
1. **配置模型**
   - 在现有 `config.json` 中新增 `shell.fish` 字段，支持 `enabled`、`confDir`、`initFile` 等配置。
   - 默认将脚本写入 `~/.config/fish/conf.d/cmdcc.fish`，可通过配置覆盖。
2. **模板生成**
   - 新增 `templates/fish/cmdcc.fish`，内容：
     ```fish
     set -l cmdcc_dir "$HOME/.config/cmdcc"
     if test -d $cmdcc_dir
       for file in $cmdcc_dir/*.sh
         test -f $file; and source $file
       end
     end
     ```
   - `setup.install` 在检测到启用时渲染模板（采用简单字符串替换）。
3. **安装流程**
   - 写入目标文件，并确保权限为 0644。
   - 不在 `_config/fish/config.fish` 中追加块，以免污染用户配置；改由 conf.d 机制自动加载。
   - 记录操作摘要（复制、跳过）便于 `cc status` 输出。
4. **卸载流程**
   - 删除生成的 `.fish` 文件；若目录为空可尝试清理。
   - `remove` 时更新摘要输出。
5. **状态检测**
   - `cc status` 列出 fish 配置文件存在与否、启用状态、目标路径等。

## PowerShell 支持
1. **配置模型**
   - 在 `shell` 下新增 `powershell` 对象，字段：`enabled`、`profilePath`、`scriptPath`。
   - 默认 profile 定位：
     - Windows: `$HOME/Documents/PowerShell/Microsoft.PowerShell_profile.ps1`
     - macOS/Linux (PowerShell Core): `$HOME/.config/powershell/Microsoft.PowerShell_profile.ps1`
   - 默认脚本写入 `$HOME/.config/cmdcc/windows/cmdcc.ps1`（可配置）。
2. **模板生成**
   - `templates/powershell/cmdcc.ps1`：
     ```powershell
     $cmdccDir = Join-Path $HOME '.config/cmdcc'
     if (Test-Path $cmdccDir) {
       Get-ChildItem $cmdccDir -Filter '*.ps1' | ForEach-Object {
         . $_.FullName
       }
     }
     ```
   - profile 注入块：使用 `# >>> cmdcc` / `# <<< cmdcc` 包裹，内容为 `.
   -profile` 引入脚本。
3. **安装流程**
   - 拷贝模板到目标脚本路径。
   - 在 profile 文件末尾注入带标记的代码块：
     ```powershell
     # >>> cmdcc shortcuts start >>>
     $cmdccBootstrap = Join-Path $HOME '.config/cmdcc/windows/cmdcc.ps1'
     if (Test-Path $cmdccBootstrap) {
       . $cmdccBootstrap
     }
     # <<< cmdcc shortcuts end <<<
     ```
   - 如 profile 不存在则创建。
4. **卸载流程**
   - 移除 profile 中的注入块。
   - 删除生成的 bootstrap 脚本。
5. **状态检测**
   - `cc status` 输出 profile 路径、标记存在性、脚本文件列表。

## 共通事项
- 需要在 `lib/setup.js` 中抽象各 Shell 的 writer/cleaner，避免逻辑耦合。
- `config.createDefaultConfig` 默认将新 Shell 标记为禁用，提示用户通过 `cc enable-shell <name>`（未来命令）开启。
- `docs/README`、`docs/ARCHITECTURE` 更新以说明新增 Shell 支持与配置项。

## 落地优先级建议
1. 先完成 fish 支持，验证模板写入流程。
2. 随后实现 PowerShell 注入与清理逻辑。
3. 最终补充 CLI 命令（如 `cc status --shells`）与测试覆盖。
