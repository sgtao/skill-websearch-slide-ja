#!/usr/bin/env bash
# =============================================================================
# validate-output.sh — websearch-slide-ja 生成 HTML 品質チェックスクリプト
#
# Usage : bash scripts/validate-output.sh <file.html>
# Exit  : 0 = ALL PASS (WARN のみ含む) / 1 = FAIL あり
#
# チェック項目:
#   [1] HTML 構文         html-validate / 基本タグ存在確認
#   [2] スライド枚数       3〜12 枚の範囲
#   [3] 必須 HTML 要素    toggle / nav-arrow / progress-bar 等
#   [4] 必須 JS 関数      fitSlide / toggleTheme / navigate 等
#   [5] 出典リンク         最終スライドに <a href= 存在するか
#   [6] CSS/JS リーク     style・script・svg 外への漏洩検出
#   [7] プレースホルダ残留  {TITLE} / {SOURCE} 等が未置換でないか
#   [8] 禁止ライブラリ     Chart.js / D3.js / <canvas> 等
# =============================================================================

set -euo pipefail

# ─── カラー定義（TTY 時のみ有効） ────────────────────────────────────────────
if [ -t 1 ]; then
  C_PASS='\033[0;32m' C_FAIL='\033[0;31m' C_WARN='\033[0;33m'
  C_INFO='\033[0;36m' C_BOLD='\033[1m' C_RESET='\033[0m'
else
  C_PASS='' C_FAIL='' C_WARN='' C_INFO='' C_BOLD='' C_RESET=''
fi

# ─── カウンタ ─────────────────────────────────────────────────────────────────
ERRORS=0
WARNINGS=0

# ─── 出力ヘルパー ─────────────────────────────────────────────────────────────
pass()    { printf "  ${C_PASS}✅ PASS${C_RESET}: %s\n" "$1"; }
fail()    { printf "  ${C_FAIL}❌ FAIL${C_RESET}: %s\n" "$1"; ERRORS=$((ERRORS + 1)); }
warn()    { printf "  ${C_WARN}⚠️  WARN${C_RESET}: %s\n" "$1"; WARNINGS=$((WARNINGS + 1)); }
info()    { printf "  ${C_INFO}ℹ️  INFO${C_RESET}: %s\n" "$1"; }
section() { printf "\n${C_BOLD}[%s]${C_RESET}\n---\n" "$1"; }

# ─── 引数・ファイル確認 ───────────────────────────────────────────────────────
FILE="${1:-}"
if [[ -z "$FILE" ]]; then
  printf "${C_FAIL}Error${C_RESET}: ファイルパスを指定してください\n" >&2
  printf "Usage: bash scripts/validate-output.sh <file.html>\n" >&2
  exit 1
fi
if [[ ! -f "$FILE" ]]; then
  printf "${C_FAIL}Error${C_RESET}: ファイルが存在しません: %s\n" "$FILE" >&2
  exit 1
fi

printf "${C_BOLD}==================================\n"
printf " websearch-slide-ja Output Validator\n"
printf "==================================\n${C_RESET}"
printf " File : %s\n" "$FILE"
printf " Size : %d KB\n" "$(( $(wc -c < "$FILE") / 1024 ))"
printf " Date : %s\n" "$(date '+%Y-%m-%d %H:%M:%S')"
printf "${C_BOLD}==================================\n${C_RESET}"

# =============================================================================
# [1] HTML 構文チェック（5-2）
# =============================================================================
section "1/8 HTML 構文チェック"

if command -v npx &>/dev/null; then
  info "html-validate を使用（npx）"
  HVRC_TMP=$(mktemp /tmp/hv-XXXXXX.json)
  cat > "$HVRC_TMP" <<'JSON'
{
  "rules": {
    "no-trailing-whitespace":  "off",
    "no-inline-style":         "off",
    "attribute-boolean-style": "off",
    "prefer-native-element":   "off",
    "void-style":              "off",
    "no-missing-references":   "off"
  }
}
JSON
  if npx --yes html-validate --config "$HVRC_TMP" "$FILE" 2>/dev/null; then
    pass "html-validate: 構文エラーなし"
  else
    fail "html-validate: 構文エラーを検出（上記メッセージ参照）"
  fi
  rm -f "$HVRC_TMP"
else
  warn "html-validate 未使用（npx 未検出）— 基本タグチェックにフォールバック"
  grep -q '<!DOCTYPE html>'  "$FILE" && pass "DOCTYPE 宣言あり"     || fail "DOCTYPE 宣言なし"
  grep -qi '<html'           "$FILE" && pass "<html> タグあり"      || fail "<html> タグなし"
  grep -q  '<head>'          "$FILE" && pass "<head> タグあり"      || fail "<head> タグなし"
  grep -q  '<body>'          "$FILE" && pass "<body> タグあり"      || fail "<body> タグなし"
  grep -q  '</body>'         "$FILE" && pass "</body> 閉じタグあり" || fail "</body> 閉じタグなし"
  grep -q  '</html>'         "$FILE" && pass "</html> 閉じタグあり" || fail "</html> 閉じタグなし"
fi

# =============================================================================
# [2] スライド枚数チェック（5-3）
# =============================================================================
section "2/8 スライド枚数チェック"

# <section class="slide..."> をカウント（CSS クラス名の誤カウントを防ぐため section タグ基点）
SLIDE_COUNT=0
SLIDE_COUNT=$(grep -c '<section class="slide' "$FILE") || true

if [[ "$SLIDE_COUNT" -eq 0 ]]; then
  fail "スライドが 0 枚（<section class=\"slide\"> が存在しない）"
elif [[ "$SLIDE_COUNT" -lt 3 ]]; then
  fail "スライド枚数 ${SLIDE_COUNT} 枚 — 最低 3 枚必要（3 枚ミニモードでも 3 枚固定）"
elif [[ "$SLIDE_COUNT" -le 12 ]]; then
  pass "スライド枚数: ${SLIDE_COUNT} 枚（許容範囲 3〜12 枚）"
else
  warn "スライド枚数: ${SLIDE_COUNT} 枚（推奨上限 12 枚を超過）"
fi

# slide-fit 枚数（参考情報 — <section タグのみ対象）
SLIDEFIT_COUNT=0
SLIDEFIT_COUNT=$(grep -c '<section class="slide slide-fit"' "$FILE") || true
if [[ "$SLIDEFIT_COUNT" -gt 0 ]]; then
  info "slide-fit スライド: ${SLIDEFIT_COUNT} 枚（一覧テーブル用・高さ可変）"
fi

# =============================================================================
# [3] 必須 HTML 要素チェック（5-4）
# =============================================================================
section "3/8 必須 HTML 要素チェック"

check_elem() {
  local label="$1" pattern="$2"
  if grep -q "$pattern" "$FILE" 2>/dev/null; then
    pass "$label"
  else
    fail "$label が見つかりません（検索パターン: ${pattern}）"
  fi
}

check_elem 'テーマ切替ボタン   #theme-toggle'          'id="theme-toggle"'
check_elem 'ビュー切替ボタン   #view-toggle'           'id="view-toggle"'
check_elem 'テーマアイコン     #theme-icon'             'id="theme-icon"'
check_elem '左ナビ矢印        .nav-prev'                'nav-prev'
check_elem '右ナビ矢印        .nav-next'                'nav-next'
check_elem 'プログレスバー    #progress-bar'            'id="progress-bar"'
check_elem 'スライド番号      #slide-counter'           'id="slide-counter"'
check_elem 'エクスポートメニュー .export-menu'          'class="export-menu"'
check_elem 'エクスポートドロップダウン #export-dropdown' 'id="export-dropdown"'
check_elem 'スライドスケーラー .slide-scaler'           'class="slide-scaler"'

# =============================================================================
# [4] 必須 JS 関数チェック（5-4 続き）
# =============================================================================
section "4/8 必須 JS 関数チェック"

check_func() {
  local fname="$1"
  if grep -q "function ${fname}(" "$FILE" 2>/dev/null; then
    pass "function ${fname}()"
  else
    fail "function ${fname}() が定義されていません"
  fi
}

check_func "fitSlide"           # fit-slide.js
check_func "toggleTheme"        # theme-toggle.js
check_func "toggleView"         # view-toggle.js
check_func "applyView"
check_func "scaleListSlides"
check_func "navigate"           # navigation.js
check_func "update"
check_func "updateArrows"
check_func "exportPDF"          # export-pdf.js
check_func "toggleExportMenu"
check_func "closeExportMenu"
check_func "exportSinglePNG"    # export-png.js
check_func "exportAllPNG"
check_func "loadScript"
check_func "buildCanvasOptions"

# =============================================================================
# [5] 出典リンクチェック（5-5）
# =============================================================================
section "5/8 出典リンクチェック"

if [[ "$SLIDE_COUNT" -gt 0 ]]; then
  LAST_SLIDE_ID="s${SLIDE_COUNT}"

  # 最終スライドのセクション内容を抽出（最大 80 行）
  LAST_BLOCK=$(grep -A 80 "id=\"${LAST_SLIDE_ID}\"" "$FILE" 2>/dev/null || true)

  # grep -c は 0 件で exit 1 を返すため || true で吸収し LINK_COUNT に格納
  LINK_COUNT=0
  LINK_COUNT=$(echo "$LAST_BLOCK" | grep -c '<a href=') || true

  if [[ "$LINK_COUNT" -gt 0 ]]; then
    pass "最終スライド (#${LAST_SLIDE_ID}) に出典リンク ${LINK_COUNT} 件"
  else
    warn "最終スライド (#${LAST_SLIDE_ID}) に出典リンクなし（会話のみモードは許容）"
  fi

  # ファイル全体の総リンク数（参考情報）
  TOTAL_LINKS=0
  TOTAL_LINKS=$(grep -c '<a href=' "$FILE") || true
  info "ファイル全体の <a href= 総数: ${TOTAL_LINKS} 件"
fi

# =============================================================================
# [6] CSS / JS リークチェック（5-5 + 追加修正①）
# =============================================================================
section "6/8 CSS / JS リークチェック"

# ── 可視本文テキスト抽出 ───────────────────────────────────────────────────────
# <style>・<script>・<svg> ブロックを除去後、全 HTML タグを除去した
# 「可視テキスト」のみを対象にパターンマッチする。
# Python3 が利用可能ならそちらを優先（改行を含む multiline ブロック除去が確実）。

if command -v python3 &>/dev/null; then
  info "本文抽出: python3 による正確な multiline 除去"

  BODY_TEXT=$(python3 - "$FILE" <<'PYEOF'
import sys, re

with open(sys.argv[1], encoding='utf-8', errors='replace') as f:
    content = f.read()

# <style>...</style> を除去（multiline）
content = re.sub(r'<style[^>]*>.*?</style>', ' ', content,
                 flags=re.IGNORECASE | re.DOTALL)
# <script>...</script> を除去
content = re.sub(r'<script[^>]*>.*?</script>', ' ', content,
                 flags=re.IGNORECASE | re.DOTALL)
# <svg>...</svg> を除去（chart-series- 等の CSS クラスを誤検知しないよう）
content = re.sub(r'<svg[^>]*>.*?</svg>', ' ', content,
                 flags=re.IGNORECASE | re.DOTALL)
# HTML コメントを除去
content = re.sub(r'<!--.*?-->', ' ', content, flags=re.DOTALL)
# <body> より前（head 部分）を除去
body_match = re.search(r'<body[^>]*>', content, re.IGNORECASE)
if body_match:
    content = content[body_match.end():]
# 残った HTML タグをすべて除去（属性含む）
content = re.sub(r'<[^>]+>', ' ', content)
# 連続空白を正規化
content = re.sub(r'\s+', ' ', content).strip()

print(content)
PYEOF
  )
else
  warn "python3 未検出 — sed による簡易抽出にフォールバック（精度が低下する場合あり）"
  BODY_TEXT=$(sed \
    -e '/<style/,/<\/style>/d' \
    -e '/<script/,/<\/script>/d' \
    -e '/<svg/,/<\/svg>/d' \
    -e 's/<!--.*-->//g' \
    "$FILE" \
    | sed 's/<[^>]*>/ /g' \
    | tr -s ' \t\n' ' ')
fi

# ── CSS 漏洩パターン検出 ──────────────────────────────────────────────────────
CSS_LEAK_FOUND=0

# 連想配列が使えない bash 3 系互換のため "パターン|ラベル" 形式で管理
CSS_CHECKS=(
  '\[data-theme=|[data-theme= (CSS 属性セレクタ)'
  ':root\s*\{|:root { (CSS :root ルール)'
  '\.slide-scaler\s*\{|.slide-scaler { (CSS クラスルール)'
  '\.slide-inner\s*\{|.slide-inner { (CSS クラスルール)'
  '@media\s+(print|screen)\s*\{|@media print/screen { (CSS メディアクエリ)'
)
for entry in "${CSS_CHECKS[@]}"; do
  pattern="${entry%%|*}"
  label="${entry#*|}"
  if echo "$BODY_TEXT" | grep -qE "$pattern" 2>/dev/null; then
    fail "CSS 定義がスライド本文に漏洩 — ${label}"
    CSS_LEAK_FOUND=1
  fi
done

# ── JS 漏洩パターン検出 ───────────────────────────────────────────────────────
JS_LEAK_FOUND=0

# function 定義（onclick 等の属性はタグ除去済みなので誤検知しない）
if echo "$BODY_TEXT" | grep -qE \
   'function\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(' 2>/dev/null; then
  fail "JS 関数定義がスライド本文に漏洩（function キーワードを検出）"
  JS_LEAK_FOUND=1
fi

# document.querySelector / getElementById の漏洩
if echo "$BODY_TEXT" | grep -qE \
   'document\.(querySelector|getElementById|querySelectorAll)\s*\(' 2>/dev/null; then
  fail "JS DOM 操作コードがスライド本文に漏洩（document.querySelector 等を検出）"
  JS_LEAK_FOUND=1
fi

if [[ "$CSS_LEAK_FOUND" -eq 0 && "$JS_LEAK_FOUND" -eq 0 ]]; then
  pass "CSS/JS 漏洩なし"
fi

# =============================================================================
# [7] テンプレートプレースホルダ残留チェック（5-5 続き）
# =============================================================================
section "7/8 テンプレートプレースホルダ残留チェック"

# SVG テンプレートの未置換プレースホルダをファイル全体から検索
PLACEHOLDERS=(
  '{TITLE}'         '{SOURCE}'
  '{AXIS_X_LABEL}'  '{AXIS_Y_LABEL}'
  '{Y_MAX}'         '{Y_MIN}'         '{Y_MID}'   '{Y_3Q}' '{Y_1Q}'
  '{P1_X}'          '{P1_Y}'
  '{P2_X}'          '{P2_Y}'
  '{P3_X}'          '{P3_Y}'
  '{SERIES_1_NAME}' '{SERIES_2_NAME}' '{SERIES_3_NAME}'
  '{PCT_1}'         '{PCT_2}'         '{PCT_3}'
  '{CENTER_LABEL}'  '{CENTER_VALUE}'
  '{X_MIN}'         '{X_MID}'         '{X_MAX}'
)

PH_FOUND=0
for ph in "${PLACEHOLDERS[@]}"; do
  if grep -qF "$ph" "$FILE" 2>/dev/null; then
    fail "未置換プレースホルダ: ${ph}"
    PH_FOUND=1
  fi
done
[[ "$PH_FOUND" -eq 0 ]] && pass "テンプレートプレースホルダ残留なし"

# =============================================================================
# [8] 禁止ライブラリ・自己完結性チェック（5-2 + 追加）
# =============================================================================
section "8/8 禁止ライブラリ・自己完結性チェック"

# ── 禁止ライブラリ ─────────────────────────────────────────────────────────────
BANNED_FOUND=0

# <canvas> タグ（SVG グラフを使うべきところで canvas を使っている場合）
if grep -qi '<canvas' "$FILE" 2>/dev/null; then
  fail "禁止: <canvas> タグを検出（Chart.js 等の使用が疑われる）"
  BANNED_FOUND=1
fi

# 禁止ライブラリの CDN URL / script src
BANNED_PATTERNS=(
  'cdn\.jsdelivr\.net.*chart[\.\-]?js'
  'cdn\.jsdelivr\.net.*d3[\.\-]?js'
  'cdnjs\.cloudflare\.com.*chart'
  'cdnjs\.cloudflare\.com.*d3\.min'
  'cdn\.jsdelivr\.net.*echarts'
  'unpkg\.com.*highcharts'
  'cdn\.jsdelivr\.net.*plotly'
  'cdn\.jsdelivr\.net.*apexcharts'
)
for pat in "${BANNED_PATTERNS[@]}"; do
  if grep -qi "$pat" "$FILE" 2>/dev/null; then
    fail "禁止ライブラリの CDN 参照を検出: ${pat}"
    BANNED_FOUND=1
  fi
done

[[ "$BANNED_FOUND" -eq 0 ]] && pass "禁止ライブラリなし（html2canvas / JSZip は許容）"

# ── 外部 CDN 参照数 ────────────────────────────────────────────────────────────
# 許容: Google Fonts(1) + html2canvas 文字列(1) + JSZip 文字列(1) = 3 件前後
CDN_COUNT=0
CDN_COUNT=$(grep -cE \
  'cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|unpkg\.com|fonts\.googleapis\.com' \
  "$FILE") || true

if [[ "$CDN_COUNT" -le 5 ]]; then
  pass "外部 CDN 参照: ${CDN_COUNT} 件（Fonts + エクスポート用 CDN のみ）"
else
  warn "外部 CDN 参照: ${CDN_COUNT} 件（エクスポート用以外の CDN がある可能性）"
fi

# ── ファイルサイズ妥当性 ───────────────────────────────────────────────────────
FILE_SIZE_BYTES=$(wc -c < "$FILE")
FILE_SIZE_KB=$((FILE_SIZE_BYTES / 1024))

if [[ "$FILE_SIZE_BYTES" -lt 5000 ]]; then
  fail "ファイルサイズが極端に小さい: ${FILE_SIZE_KB} KB（空生成の可能性）"
elif [[ "$FILE_SIZE_KB" -gt 5120 ]]; then
  warn "ファイルサイズ: ${FILE_SIZE_KB} KB（Base64 画像埋め込みがある可能性）"
else
  pass "ファイルサイズ: ${FILE_SIZE_KB} KB（正常範囲）"
fi

# ── Noto Sans JP フォント ──────────────────────────────────────────────────────
if grep -q 'Noto Sans JP' "$FILE" 2>/dev/null; then
  pass "Noto Sans JP フォント読み込みあり"
else
  warn "Noto Sans JP フォントの読み込みが見つかりません"
fi

# =============================================================================
#  結果サマリ
# =============================================================================
printf "\n${C_BOLD}==================================\n"
printf " RESULT SUMMARY\n"
printf "  Errors   : %d\n" "$ERRORS"
printf "  Warnings : %d\n" "$WARNINGS"
printf "==================================${C_RESET}\n"

if [[ "$ERRORS" -eq 0 && "$WARNINGS" -eq 0 ]]; then
  printf "${C_PASS}${C_BOLD} ✅ ALL PASS${C_RESET}\n"
elif [[ "$ERRORS" -eq 0 ]]; then
  printf "${C_PASS}${C_BOLD} ✅ PASS${C_RESET} (with %d warning(s))\n" "$WARNINGS"
else
  printf "${C_FAIL}${C_BOLD} ❌ FAIL${C_RESET} — %d error(s), %d warning(s)\n" \
         "$ERRORS" "$WARNINGS"
fi

printf "${C_BOLD}==================================${C_RESET}\n"

if [[ "$ERRORS" -gt 0 ]]; then
  exit 1
fi
exit 0
