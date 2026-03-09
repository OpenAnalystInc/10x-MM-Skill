#!/usr/bin/env bash
# 10x Marketing Manager — Claude Code Status Line v3
# Proper grid layout with aligned columns
#
# Row 1:  10xMM @handle (email)              │  ● MCP: on
# Row 2:  Skill: Terminal                    │  Tokens: 68k + 12k
# Row 3:  Model: Opus 4.6                   │  Cost: $1.47
# Row 4:  Context ██████████████░░░░░░░░░░░░░░░░░░░ 42%

# ── 0. Guard stdin ──────────────────────────────────────────────────────────
if [ -t 0 ]; then exit 0; fi
input=$(timeout 2 cat 2>/dev/null || cat)
[ -z "$input" ] && exit 0

# ── 1. Colors ───────────────────────────────────────────────────────────────
RST='\033[0m'
BOLD='\033[1m'
DIM='\033[2m'

CLR_EMAIL='\033[38;2;99;102;241m'        # Indigo
CLR_MCP_ON='\033[1;32m'                  # Bright green
CLR_MCP_OFF='\033[1;31m'                 # Bright red
CLR_MCP_UNK='\033[1;33m'                 # Bright yellow
CLR_SKILL='\033[38;2;236;72;153m'        # Pink
CLR_MODEL='\033[38;2;168;85;247m'        # Purple
CLR_TOKENS='\033[38;2;245;158;11m'       # Amber
CLR_COST='\033[38;2;6;182;212m'          # Cyan

CLR_CTX_LOW='\033[38;2;228;228;231m'
CLR_CTX_MED='\033[38;2;251;146;60m'
CLR_CTX_HIGH='\033[38;2;239;68;68m'
CLR_CTX_CRIT='\033[38;2;220;38;38m'
CLR_BAR_EMPTY='\033[38;2;50;50;58m'
CLR_SEP='\033[38;2;70;70;80m'

# ── Helper: right-pad a colored string to visible width ─────────────────────
rpad() {
  local str="$1" target_w="$2"
  local plain
  plain=$(printf '%b' "$str" | sed $'s/\033\\[[0-9;]*m//g')
  local vlen=${#plain}
  local pad=$(( target_w - vlen ))
  printf '%b' "$str"
  [ "$pad" -gt 0 ] && printf "%${pad}s" ""
}

fmt_tok() {
  awk -v t="$1" 'BEGIN {
    if (t+0 >= 1000000) printf "%.3fM", t/1000000
    else printf "%.3fk", t/1000
  }'
}

# ── 2. Parse JSON (single awk pass) ────────────────────────────────────────
eval "$(echo "$input" | awk '
BEGIN { FS="" }
{ s = s $0 }
END {
  extract_str(s, "cwd")
  extract_nested_str(s, "model", "display_name")
  extract_nested_str(s, "model", "id")
  extract_nested_str(s, "workspace", "current_dir")
  extract_nested_num(s, "cost", "total_cost_usd")
  extract_nested_num(s, "context_window", "context_window_size")
  extract_nested_num(s, "context_window", "used_percentage")
  extract_nested_num(s, "context_window", "total_input_tokens")
  extract_nested_num(s, "context_window", "total_output_tokens")
  extract_deep_num(s, "context_window", "current_usage", "input_tokens")
  extract_deep_num(s, "context_window", "current_usage", "output_tokens")
  extract_deep_num(s, "context_window", "current_usage", "cache_creation_input_tokens")
  extract_deep_num(s, "context_window", "current_usage", "cache_read_input_tokens")
}
function extract_str(json, key,    pat, val, rest) {
  pat = "\"" key "\"[ \t]*:[ \t]*\""
  if (match(json, pat)) {
    rest = substr(json, RSTART + RLENGTH)
    if (match(rest, /^[^"]*/)) {
      val = substr(rest, 1, RLENGTH)
      gsub(/\047/, "\047\\\047\047", val)
      print "J_" key "=\047" val "\047"
    }
  }
}
function extract_nested_str(json, parent, key,    pat, rest, block, val) {
  pat = "\"" parent "\"[ \t]*:[ \t]*\\{"
  if (match(json, pat)) {
    rest = substr(json, RSTART + RLENGTH)
    if (match(rest, /[^}]*/)) {
      block = substr(rest, 1, RLENGTH)
      pat = "\"" key "\"[ \t]*:[ \t]*\""
      if (match(block, pat)) {
        rest = substr(block, RSTART + RLENGTH)
        if (match(rest, /^[^"]*/)) {
          val = substr(rest, 1, RLENGTH)
          gsub(/\047/, "\047\\\047\047", val)
          print "J_" parent "_" key "=\047" val "\047"
        }
      }
    }
  }
}
function extract_nested_num(json, parent, key,    pat, rest, block, val) {
  pat = "\"" parent "\"[ \t]*:[ \t]*\\{"
  if (match(json, pat)) {
    rest = substr(json, RSTART + RLENGTH)
    block = rest
    pat = "\"" key "\"[ \t]*:[ \t]*"
    if (match(block, pat)) {
      rest = substr(block, RSTART + RLENGTH)
      if (match(rest, /^[0-9.]+/)) {
        val = substr(rest, 1, RLENGTH)
        print "J_" parent "_" key "=" val
      }
    }
  }
}
function extract_deep_num(json, p1, p2, key,    pat, outer, inner, rest, val) {
  pat = "\"" p1 "\"[ \t]*:[ \t]*\\{"
  if (match(json, pat)) {
    outer = substr(json, RSTART + RLENGTH)
    pat = "\"" p2 "\"[ \t]*:[ \t]*\\{"
    if (match(outer, pat)) {
      inner = substr(outer, RSTART + RLENGTH)
      pat = "\"" key "\"[ \t]*:[ \t]*"
      if (match(inner, pat)) {
        rest = substr(inner, RSTART + RLENGTH)
        if (match(rest, /^[0-9.]+/)) {
          val = substr(rest, 1, RLENGTH)
          print "J_" p1 "_" p2 "_" key "=" val
        }
      }
    }
  }
}
')"

# ── 3. Derive display values ───────────────────────────────────────────────

# Directory
cwd="${J_workspace_current_dir:-$J_cwd}"
cwd="${cwd:-$(pwd)}"
cwd_clean=$(echo "$cwd" | tr '\\' '/')
cwd_display="${cwd_clean/#$HOME/\~}"
if [ "${#cwd_display}" -gt 35 ]; then
  parent=$(dirname "$cwd_display"); parent="${parent##*/}"
  base="${cwd_display##*/}"
  cwd_display=".../${parent}/${base}"
fi

# Model
model="${J_model_display_name:-unknown}"
model_id="${J_model_id:-}"
if [ -n "$model_id" ]; then
  ver=$(echo "$model_id" | sed -n 's/.*-\([0-9]*\)-\([0-9]*\)$/\1.\2/p')
  if [ -n "$ver" ] && ! echo "$model" | grep -q '[0-9]'; then
    model="${model} ${ver}"
  fi
fi

# Tokens — cumulative total (all input + all output across session)
cur_in="${J_context_window_current_usage_input_tokens:-0}"
cur_out="${J_context_window_current_usage_output_tokens:-0}"
cum_in="${J_context_window_total_input_tokens:-0}"
cum_out="${J_context_window_total_output_tokens:-0}"
tok_total=$(( cum_in + cum_out ))
# Fallback to current window if cumulative not available yet
if [ "$tok_total" -eq 0 ] 2>/dev/null && [ "$cur_in" -gt 0 ] 2>/dev/null; then
  tok_total=$(( cur_in + cur_out ))
fi
tok_display=$(fmt_tok "$tok_total")

# Cost — always 3 decimal places
cost_raw="${J_cost_total_cost_usd:-0}"
if [ -z "$cost_raw" ] || [ "$cost_raw" = "0" ]; then
  cost_display='$0.000'
else
  cost_display=$(awk -v c="$cost_raw" 'BEGIN { printf "$%.3f", c }')
fi

# Context
ctx_size="${J_context_window_context_window_size:-200000}"
cache_create="${J_context_window_current_usage_cache_creation_input_tokens:-0}"
cache_read="${J_context_window_current_usage_cache_read_input_tokens:-0}"
ctx_used=$(( cur_in + cache_create + cache_read ))
ctx_pct=0
if [ "$cur_in" -gt 0 ] 2>/dev/null && [ "$ctx_size" -gt 0 ] 2>/dev/null; then
  ctx_pct=$(( ctx_used * 100 / ctx_size ))
elif [ -n "$J_context_window_used_percentage" ]; then
  ctx_pct=$(echo "$J_context_window_used_percentage" | cut -d. -f1)
fi
[ -z "$ctx_pct" ] && ctx_pct=0

if [ "$ctx_pct" -gt 90 ] 2>/dev/null; then ctx_clr="$CLR_CTX_CRIT"
elif [ "$ctx_pct" -gt 75 ] 2>/dev/null; then ctx_clr="$CLR_CTX_HIGH"
elif [ "$ctx_pct" -gt 40 ] 2>/dev/null; then ctx_clr="$CLR_CTX_MED"
else ctx_clr="$CLR_CTX_LOW"; fi

ctx_warn=""
ctx_remain=$(( 100 - ctx_pct ))
if [ "$ctx_pct" -ge 95 ] 2>/dev/null; then
  ctx_warn="  ${CLR_CTX_CRIT}${BOLD}COMPACTING${RST}"
elif [ "$ctx_pct" -ge 80 ] 2>/dev/null; then
  ctx_warn="  ${CLR_CTX_HIGH}${ctx_remain}% left${RST}"
fi

# ── 4. Load .env ────────────────────────────────────────────────────────────
env_file=""
for try_dir in "$cwd_clean" "$(pwd | tr '\\' '/')"; do
  [ -f "${try_dir}/.env" ] && env_file="${try_dir}/.env" && break
done

handle=""; user_email=""; mm_url=""
if [ -n "$env_file" ]; then
  handle=$(grep -m1 '^LINK_PLATFORM_HANDLE=' "$env_file" 2>/dev/null | cut -d'=' -f2-)
  user_email=$(grep -m1 '^USER_EMAIL=' "$env_file" 2>/dev/null | cut -d'=' -f2-)
fi
handle="${handle:-${LINK_PLATFORM_HANDLE:-}}"
user_email="${user_email:-${USER_EMAIL:-}}"
mm_url="https://${handle}.mcp.10x.in"

# ── 5. MCP status (cached 30s) ─────────────────────────────────────────────
cache_dir="/tmp/.mm-statusline"; mkdir -p "$cache_dir" 2>/dev/null
cache_file="${cache_dir}/mcp-status"
mcp_status="?"
use_cache=false
if [ -f "$cache_file" ]; then
  if [ "$(uname)" = "Darwin" ]; then
    cache_age=$(( $(date +%s) - $(stat -f %m "$cache_file" 2>/dev/null || echo 0) ))
  else
    cache_age=$(( $(date +%s) - $(stat -c %Y "$cache_file" 2>/dev/null || echo 0) ))
  fi
  [ "$cache_age" -lt 30 ] && use_cache=true
fi
if [ "$use_cache" = true ]; then
  mcp_status=$(cat "$cache_file" 2>/dev/null)
else
  if command -v curl >/dev/null 2>&1; then
    resp=$(curl -sf --max-time 2 --connect-timeout 1 "${mm_url}/health" 2>/dev/null)
    [ $? -eq 0 ] && [ -n "$resp" ] && mcp_status="on" || mcp_status="off"
  fi
  echo "$mcp_status" > "$cache_file" 2>/dev/null
fi
case "$mcp_status" in
  on)  mcp_icon="●"; mcp_clr="$CLR_MCP_ON" ;;
  off) mcp_icon="○"; mcp_clr="$CLR_MCP_OFF" ;;
  *)   mcp_icon="◌"; mcp_clr="$CLR_MCP_UNK" ;;
esac

# ── 6. Skill detection (cached 5s) ─────────────────────────────────────────
skill="Default"
skill_cache="${cache_dir}/skill"
_detect_skill() {
  local search_path tpath proj_hash proj_dir
  search_path=$(echo "$1" | tr '\\' '/')
  while [ -n "$search_path" ] && [ "$search_path" != "/" ] && [ "$search_path" != "." ]; do
    proj_hash=$(echo "$search_path" | sed 's|^/\([a-zA-Z]\)/|\U\1--|; s|:/|--|; s|/|-|g')
    proj_dir="$HOME/.claude/projects/${proj_hash}"
    if [ -d "$proj_dir" ]; then
      tpath=$(ls -t "$proj_dir"/*.jsonl 2>/dev/null | head -1)
      [ -n "$tpath" ] && break
    fi
    search_path=$(echo "$search_path" | sed 's|/[^/]*$||')
  done
  if [ -n "$tpath" ] && [ -f "$tpath" ]; then
    local lt
    lt=$(tail -50 "$tpath" 2>/dev/null | grep -o '"type":"tool_use","id":"[^"]*","name":"[^"]*"' | tail -1 | sed 's/.*"name":"\([^"]*\)".*/\1/')
    if [ -n "$lt" ]; then
      case "$lt" in
        Task) echo "Agent";; Read) echo "Read";; Write) echo "Write";; Edit) echo "Edit";;
        Glob) echo "Search";; Grep) echo "Grep";; Bash) echo "Terminal";;
        WebSearch) echo "Web Search";; WebFetch) echo "Web Fetch";; Skill) echo "Skill";;
        AskUserQuestion) echo "Asking...";; EnterPlanMode) echo "Planning";;
        ExitPlanMode) echo "Plan Ready";; TaskCreate|TaskUpdate) echo "Tasks";;
        *) echo "$lt";;
      esac; return
    fi
  fi
  echo "Default"
}
use_sk=false
if [ -f "$skill_cache" ]; then
  if [ "$(uname)" = "Darwin" ]; then
    sk_age=$(( $(date +%s) - $(stat -f %m "$skill_cache" 2>/dev/null || echo 0) ))
  else
    sk_age=$(( $(date +%s) - $(stat -c %Y "$skill_cache" 2>/dev/null || echo 0) ))
  fi
  [ "$sk_age" -lt 5 ] && use_sk=true
fi
if [ "$use_sk" = true ]; then skill=$(cat "$skill_cache" 2>/dev/null)
else skill=$(_detect_skill "$cwd"); echo "$skill" > "$skill_cache" 2>/dev/null; fi

# ── 7. Render (grid layout) ────────────────────────────────────────────────
#
# Column widths
C1=40    # Left column
SEP_STR="  $(printf '%b' "${CLR_SEP}│${RST}")  "

# ── Row 1: Brand + Identity  │  MCP Status ──
if [ -n "$user_email" ]; then
  left1="${CLR_EMAIL}Email:  ${user_email}${RST}"
else
  left1="${CLR_MCP_UNK}Email:  not set${RST}"
fi
right1="${mcp_clr}${mcp_icon} MCP: ${mcp_status}${RST}"

printf ' '
rpad "$left1" "$C1"
printf '%b' "$SEP_STR"
printf '%b\n' "$right1"

# ── Row 2: Skill  │  Tokens ──
left2="${CLR_SKILL}Skill:  ${BOLD}${skill}${RST}"
right2="${CLR_TOKENS}Tokens:  ${tok_display}${RST}"

printf ' '
rpad "$left2" "$C1"
printf '%b' "$SEP_STR"
printf '%b\n' "$right2"

# ── Row 3: Model  │  Cost ──
left3="${CLR_MODEL}Model:  ${BOLD}${model}${RST}"
right3="${CLR_COST}Cost:   ${cost_display}${RST}"

printf ' '
rpad "$left3" "$C1"
printf '%b' "$SEP_STR"
printf '%b\n' "$right3"

# ── Row 4: Context bar (within C1 column) ──
# "Context: " = 9 visible chars, so bar gets C1 - 9 - 5 (for " XX%")
CTX_LABEL_W=9
CTX_PCT_W=5
CTX_BAR_W=$(( C1 - CTX_LABEL_W - CTX_PCT_W ))
[ "$CTX_BAR_W" -lt 10 ] && CTX_BAR_W=10

filled=$(( ctx_pct * CTX_BAR_W / 100 ))
[ "$filled" -gt "$CTX_BAR_W" ] && filled=$CTX_BAR_W
empty=$(( CTX_BAR_W - filled ))
bar=""; i=0; while [ $i -lt $filled ]; do bar="${bar}█"; i=$((i+1)); done
bar_e=""; i=0; while [ $i -lt $empty ]; do bar_e="${bar_e}░"; i=$((i+1)); done

printf ' '
printf '%b' "${ctx_clr}Context: ${bar}${RST}${CLR_BAR_EMPTY}${bar_e}${RST} ${ctx_clr}${ctx_pct}%${RST}${ctx_warn}"
