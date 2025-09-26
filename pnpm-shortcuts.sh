
########## portable-extras.sh (zsh/bash 通用) ##########

# --- helpers: 安全添加 PATH（前/后），避免重复 ---
_add_path_front() {
  case ":$PATH:" in *":$1:"*) ;; *) PATH="$1:$PATH";; esac
}
_add_path_back() {
  case ":$PATH:" in *":$1:"*) ;; *) PATH="$PATH:$1";; esac
}

# ---------------- PNPM ----------------
# 优先使用现成 PNPM_HOME；否则按平台常见目录探测
if [[ -z "${PNPM_HOME:-}" ]]; then
  if [[ -n "${ZSH_VERSION:-}${BASH_VERSION:-}" ]]; then
    # macOS 默认
    [[ -d "$HOME/Library/pnpm" ]] && PNPM_HOME="$HOME/Library/pnpm"
    # Linux 默认
    [[ -z "${PNPM_HOME:-}" && -d "$HOME/.local/share/pnpm" ]] && PNPM_HOME="$HOME/.local/share/pnpm"
    # Windows (Git Bash / WSL 常见路径)
    [[ -z "${PNPM_HOME:-}" && -d "$HOME/AppData/Local/pnpm" ]] && PNPM_HOME="$HOME/AppData/Local/pnpm"
    [[ -z "${PNPM_HOME:-}" && -d "/mnt/c/Users/$USER/AppData/Local/pnpm" ]] && PNPM_HOME="/mnt/c/Users/$USER/AppData/Local/pnpm"
    [[ -z "${PNPM_HOME:-}" && -d "/c/Users/$USER/AppData/Local/pnpm" ]] && PNPM_HOME="/c/Users/$USER/AppData/Local/pnpm"
  fi
fi
# 若已找到 PNPM_HOME，则入 PATH；否则不报错（保持可移植）
if [[ -n "${PNPM_HOME:-}" && -d "$PNPM_HOME" ]]; then
  export PNPM_HOME
  _add_path_front "$PNPM_HOME"
fi

# 常见用户级 bin
[[ -d "$HOME/.local/bin" ]] && _add_path_front "$HOME/.local/bin"

# ---------------- Docker CLI completions (zsh) ----------------
# 说明：仅 zsh 下启用；若 ~/.docker/completions 存在则加入 fpath，然后在首次加载时 compinit。
if [[ -n "${ZSH_VERSION:-}" ]]; then
  # 加入 Docker Desktop 生成的 completions 目录（若存在）
  if [[ -d "$HOME/.docker/completions" ]]; then
    fpath=("$HOME/.docker/completions" $fpath)
  fi

  # 仅首次会 compinit；避免重复执行
  if ! typeset -f _compinit_guard >/dev/null; then
    _compinit_guard() {
      autoload -Uz compinit
      # -C: 跳过安全检查以提速；有权限提示时可改为不带 -C
      compinit -C
    }
    _compinit_guard
  fi
fi

# （可选）如果没有本地 completions，但 docker 存在，可自动生成一份到缓存目录：
# if [[ -n "${ZSH_VERSION:-}" && -x "$(command -v docker)" && ! -f "$HOME/.zsh/_docker" ]]; then
#   mkdir -p "$HOME/.zsh"
#   docker completion zsh > "$HOME/.zsh/_docker" 2>/dev/null || true
#   fpath=("$HOME/.zsh" $fpath)
# fi

# ---------------- fzf ----------------
# 优先使用安装脚本放置的文件；否则尝试常见路径；zsh/bash 都兼容
if [[ -n "${ZSH_VERSION:-}" ]]; then
  if [[ -f "$HOME/.fzf.zsh" ]]; then
    source "$HOME/.fzf.zsh"
  elif [[ -f "/opt/homebrew/opt/fzf/shell/key-bindings.zsh" ]]; then
    source "/opt/homebrew/opt/fzf/shell/key-bindings.zsh"
    [[ -f "/opt/homebrew/opt/fzf/shell/completion.zsh" ]] && source "/opt/homebrew/opt/fzf/shell/completion.zsh"
  elif [[ -f "/usr/share/fzf/key-bindings.zsh" ]]; then
    source "/usr/share/fzf/key-bindings.zsh"
    [[ -f "/usr/share/fzf/completion.zsh" ]] && source "/usr/share/fzf/completion.zsh"
  fi
elif [[ -n "${BASH_VERSION:-}" ]]; then
  if [[ -f "$HOME/.fzf.bash" ]]; then
    source "$HOME/.fzf.bash"
  elif [[ -f "/usr/share/fzf/key-bindings.bash" ]]; then
    source "/usr/share/fzf/key-bindings.bash"
    [[ -f "/usr/share/fzf/completion.bash" ]] && source "/usr/share/fzf/completion.bash"
  fi
fi
########## end portable-extras.sh ##########


# ---------------- Aliases ----------------
# 说明：以下别名均可按需修改或删除

# 简写 pnpm 命令
alias p="pnpm"
alias pi="p install"
alias pu="p update"
alias pd="p add"
alias pr="p remove"
alias pl="p list"
alias pp="p publish"
# alias pg="p generate"
alias run="p run"
alias rdev="p run dev"
alias run-dev="rdev"
alias rundev="rdev"
alias rpro="p run build:pro"
alias rprod="p run build:pro"
alias run-prod="p run build:prod"
alias run-pro="rpro"
alias runpro="rpro"
alias rstage="p run build:stage"
alias run-stage="rstage"
alias runstage="rstage"
alias preview="p run preview"
