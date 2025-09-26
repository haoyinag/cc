
# 简写 docker 命令
# alias dcd="docker compose down"
# alias dcr="docker compose run"

 # docker-shortcuts.sh
# Cross-shell (zsh/bash), macOS(BSD find)/Linux, WSL2-friendly Docker Compose helpers.
# Commands: dcu (up -d), dcd (down), dcr (run ...)
# Usage: dcu [-l|--list] [extra docker-compose args...]
# Env:
#   DCPATHS=".:$GITPATH:$WORKPATH:$TVPATH"   # search roots (colon separated)
#   DC_PRUNE_DIRS=".git:node_modules:dist:build:.venv"  # pruned dirs (colon separated)
#   DC_MAX_DEPTH=4  # search depth limit

# ---------------- User presets (optional) ----------------
: "${GITPATH:=/Users/ccc/Documents/GitHub}"
: "${WORKPATH:=/Users/ccc/Documents/Work}"
: "${TVPATH:=/Users/ccc/Documents/GitHub/DockerProjets/AutoTV}"
: "${DCPATHS:=.:${GITPATH:-}:${WORKPATH:-}:${TVPATH:-}}"
: "${DC_PRUNE_DIRS:=.git:node_modules:dist:build:.venv}"
: "${DC_MAX_DEPTH:=4}"

# ---------------- Helpers ----------------
_dc_has() { command -v "$1" >/dev/null 2>&1; }

# Return compose command as array (docker compose | docker-compose)
_dc_compose_words() {
  local -a words
  if _dc_has docker && docker compose version >/dev/null 2>&1; then
    words=(docker compose)
  elif _dc_has docker-compose; then
    words=(docker-compose)
  else
    words=()
  fi
  printf '%s\n' "${words[@]}"
}

# Print lines: "<dir>\t<file>" for each compose file under root, pruned. 
_dc_scan_root() {
  local root="$1"
  [[ -d "$root" ]] || return 0
  # 直接找 compose 文件，不做 prune，确保能扫到
  find "$root" -maxdepth "$DC_MAX_DEPTH" -type f \( \
      -name 'docker-compose.yml' -o \
      -name 'docker-compose.yaml' -o \
      -name 'compose.yml' -o \
      -name 'compose.yaml' \
    \) -print 2>/dev/null \
  | while IFS= read -r f; do
      printf '%s\t%s\n' "$(dirname "$f")" "$f"
    done
}

# —— 忽略 DCPATHS 里的空项，并汇总所有候选 —— 
# —— 忽略 DCPATHS 里的空项，并汇总所有候选（zsh/bash 兼容分割）——
_dc_scan_candidates() {
  if [[ -n "${ZSH_VERSION:-}" ]]; then
    # zsh：用参数展开 ${(s/:/)var} 按 ':' 切分
    local -a roots
    roots=(${(s/:/)DCPATHS})
    for root in "${roots[@]}"; do
      [[ -n "$root" && -d "$root" ]] || continue
      _dc_scan_root "$root"
    done | sed '/^\s*$/d' | sort -u
  else
    # bash：IFS=':' + 普通 for 即可
    local acc=""
    local IFS=':'
    local root
    for root in $DCPATHS; do
      [[ -n "$root" && -d "$root" ]] || continue
      acc+="$(_dc_scan_root "$root")"$'\n'
    done
    printf '%s\n' "$acc" | sed '/^\s*$/d' | sort -u
  fi
}


# Numbered picker (fallback when no fzf). Echo picked "dir<TAB>file".
_dc_pick_from_list() {
  local list="$1"
  if _dc_has fzf; then
    printf '%s\n' "$list" | awk -F'\t' '{print $1 "  →  " $2}' \
      | fzf --prompt="选择一个 docker compose 项目 > " --height=60% --reverse \
      | awk -F'  →  ' '{print $1"\t"$2}'
    return
  fi
  echo "可选项目："
  nl -ba <<<"$(printf '%s\n' "$list" | awk -F'\t' '{print $1 "  →  " $2}')" | sed 's/^/  /'
  while true; do
    printf "输入编号（q 取消）： "
    IFS= read -r idx || return 130
    [[ "$idx" == [Qq] ]] && return 1
    [[ "$idx" =~ ^[0-9]+$ ]] || { echo "无效选择，请输入数字。"; continue; }
    local picked
    picked="$(printf '%s\n' "$list" | sed -n "${idx}p")"
    [[ -n "$picked" ]] && { printf '%s\n' "$picked"; return 0; }
    echo "超出范围，请重试。"
  done
}

# Find compose in given dir (current dir if omitted). Echo path.
_dc_find_compose_file() {
  local dir="${1:-.}"
  for f in docker-compose.yml docker-compose.yaml compose.yml compose.yaml; do
    [[ -f "$dir/$f" ]] && { echo "$dir/$f"; return 0; }
  done
  return 1
}

# Resolve compose file path into REPLY.
# Behavior:
#  - If current dir has exactly 1 compose file and NOT forced list -> use it.
#  - Else scan candidates and pick interactively.
_dc_resolve_compose_file() {
  local force_list="${1:-0}"

  if (( force_list == 0 )); then
    local here_count
    _dc_log "🔍 正在当前目录检查 compose（<=${DC_MAX_DEPTH} 层）..."
    here_count=$(find . -maxdepth "$DC_MAX_DEPTH" -type f \( -name 'docker-compose.yml' -o -name 'docker-compose.yaml' -o -name 'compose.yml' -o -name 'compose.yaml' \) -print 2>/dev/null | wc -l | tr -d ' ')
    if (( here_count == 1 )); then
      REPLY="$(_dc_find_compose_file ".")"
      _dc_log "➡️  使用当前目录的 compose 文件: $REPLY"
      return 0
    fi
  fi

  _dc_log "🔎 正在从预设目录查找 Docker Compose 项目（<=${DC_MAX_DEPTH} 层）..."
  _dc_log "📁 搜索目录: $(_dc_join_roots)"
  local candidates; candidates="$(_dc_scan_candidates)"
  if [[ -n "$candidates" ]]; then
    _dc_log "📄 找到候选 compose 文件:" 
    printf '%s\n' "$candidates" | awk -F'\t' '{print "   • " $2}' >&2
    local picked; picked="$(_dc_pick_from_list "$candidates")" || return 130
    REPLY="$(printf '%s' "$picked" | awk -F'\t' '{print $2}')"
    _dc_log "➡️  使用 compose 文件: $REPLY"
    return 0
  fi

  echo "❌ 未找到任何 Docker Compose 项目。请检查 DCPATHS：$DCPATHS"
  return 2
}

# Execute a compose subcommand using a specific compose file
_dc_exec_with_file() {
  local compose_file="$1"; shift
  local dir base line
  dir="$(cd "$(dirname "$compose_file")" && pwd)"
  base="$(basename "$compose_file")"

  local -a CMD=()
  while IFS= read -r line; do CMD+=("$line"); done < <(_dc_compose_words)
  if (( ${#CMD[@]} == 0 )); then
    echo "❌ 未找到 docker compose 命令（需要 'docker compose' 或 'docker-compose'）"
    return 127
  fi

  ( cd "$dir" && "${CMD[@]}" -f "$base" "$@" )
}

# ---------------- Public commands ----------------
unalias dcu 2>/dev/null || true
dcu() {
  local force_list=0
  case "${1:-}" in -l|--list) force_list=1; shift;; esac
  _dc_resolve_compose_file "$force_list" || return $?
  local cf="$REPLY"
  _dc_exec_with_file "$cf" up -d "$@" && echo "✅ Up: $cf"
}

unalias dcd 2>/dev/null || true
dcd() {
  local force_list=0
  case "${1:-}" in -l|--list) force_list=1; shift;; esac
  _dc_resolve_compose_file "$force_list" || return $?
  local cf="$REPLY"
  _dc_exec_with_file "$cf" down "$@" && echo "🛑 Down: $cf"
}

unalias dcr 2>/dev/null || true
dcr() {
  local force_list=0
  case "${1:-}" in -l|--list) force_list=1; shift;; esac
  _dc_resolve_compose_file "$force_list" || return $?
  local cf="$REPLY"
  # usage: dcr SERVICE bash   |  dcr --rm SERVICE npm run foo
  _dc_exec_with_file "$cf" run "$@" && echo "🏃 Run: $*   (file: $cf)"
}

# convenience
unalias dc 2>/dev/null || true
dc() { docker compose "$@"; }

_dc_log() {
  printf '%s\n' "$*" >&2
}

_dc_join_roots() {
  local IFS=':'
  local root
  local acc=()
  if [[ -n "${ZSH_VERSION:-}" ]]; then
    local -a roots
    roots=(${(s/:/)DCPATHS})
    for root in "${roots[@]}"; do
      [[ -n "$root" ]] && acc+=("$root")
    done
  else
    for root in $DCPATHS; do
      [[ -n "$root" ]] && acc+=("$root")
    done
  fi
  printf '%s' "${acc[*]:-<无有效目录>}"
}
