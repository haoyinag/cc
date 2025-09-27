# cmdcc Architecture & Extension Spec

## Vision
- Deliver a shell-agnostic command enhancement hub installable via Node/npm only.
- Provide modular shortcut packs that can evolve without breaking user customization.
- Offer predictable lifecycle hooks (install/remove/status) with self-healing capabilities.

## Asset Extension Specification
- **Asset Definition**: each shortcut pack is described by an object `{ id, file, group, description, defaultEnabled, keywords }`.
- **Source Layout**: assets reside at repository root as `.sh` files; optional future language-specific payloads live under `assets/<id>/`.
- **Manifest**: centralized registry (`lib/assets/registry.js`) exports ordered definitions array; CLI uses manifest for listing/help and setup uses it for installation.
- **Enablement Logic**:
  - Only enabled assets are copied into `~/.config/cmdcc` during setup/postinstall.
  - Disabled assets remain in package but skipped, allowing staged rollout.
- **Backward Compatibility**:
  - Legacy auto-discovery of `.sh` files remains as fallback when definitions missing.
  - Manifest unknown IDs are ignored gracefully.
- **Extensibility Hooks**: assets may optionally export `postInstall(ctx)` / `preRemove(ctx)` JS hooks (future work) resolved via `lib/assets/hooks/<id>.js`.

## Configuration System
- **Location**: default config file at `~/.config/cmdcc/config.json`.
- **Schema**:
  ```json
  {
    "version": 1,
    "modules": {
      "pnpm": { "enabled": true },
      "docker": { "enabled": true }
    },
    "enabledAssets": ["pnpm", "docker"],
    "shell": {
      "rcFiles": []
    }
  }
  ```
- **Resolution Rules**:
  - `modules.<id>.enabled` 是首选控制开关；若未出现则回退到模块默认值。
  - 为兼容旧版本仍会读取 `enabledAssets` 数组，但写入时同时维护二者。
  - 缺失配置文件时会生成默认配置；解析失败时会备份原始文件并使用默认值继续运行。
  - Future-proof via `version` field and migration handler in `lib/config.js`.
- **Runtime Access**: `lib/config.js` exposes `loadConfig(opts)`, `saveConfig(config, opts)`, `resolveEnabledAssets(manifest, config)` utilities.
- **Overrides**: CLI allows `--config <path>` (future) and internal APIs accept `configDir` to facilitate testing.

## CLI Command Model
- **Registry Driven**: `lib/commands/index.js` exports map of `{ name, aliases, description, handler }`.
- **Built-in Commands**: `setup`, `remove`, `status`, `help`, `list`, `enable <id>`, `disable <id>`.
- **Help Generation**: `cc help` renders registry table; unknown command triggers suggestion.
- **Error Handling**: handlers throw `CliError` with exit codes; CLI centralizes error formatting.

## Cross-Shell Roadmap
1. **fish**: generate `~/.config/fish/conf.d/cmdcc.fish` from templates; respect `config.shell.rcFiles` overrides.
2. **PowerShell**: register module script at `$HOME/Documents/PowerShell/Microsoft.PowerShell_profile.ps1` with opt-in flag.
3. **Completion Packs**: extend manifest to declare `completions` with shell targets; CLI installs relevant files.
4. **Testing Matrix**: integrate shell-specific smoke tests in CI using docker containers (bash, zsh, fish).

## Command Enhancement Roadmap
- Shortcuts Packs backlog: `git-pro`, `node-toolbox`, `k8s`, `cloudctl`.
- Utility commands: `cc doctor` (env check), `cc upgrade` (self-update suggestion), `cc doctor --json` (future).
- Config management: `cc config path`, `cc config set <key> <value>`.
- Observability: verbose/debug flags, log redirection to `~/.config/cmdcc/logs/` (future optional).

## Testing & CI Baseline
- 内置 `scripts/run-tests.js` 测试跑器，复用 Node 原生 `assert`。
- 使用临时目录模拟 HOME/RC 文件，避免污染真实环境。
- 后续可在 CI 中针对 Node 14/16/18 执行上述脚本。
