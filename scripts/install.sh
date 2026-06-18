#!/usr/bin/env bash
# install.sh - globis-course-deepdive スキルのインストール支援スクリプト
# 使い方:
#   bash scripts/install.sh        # ファイルリスト表示 → ~/.claude/skills へコピー
#   bash scripts/install.sh --zip  # dist/ 配下に ZIP アーカイブを生成

set -euo pipefail

# スクリプトの1つ上（リポジトリルート）を基準ディレクトリとする
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"
# echo $ROOT_DIR

# ─── Step 1: SKILL.md があるディレクトリを検出（直下1階層のみ） ───
SKILL_DIR=""
for d in "${ROOT_DIR}"/*/; do
  [[ -f "${d}SKILL.md" ]] && SKILL_DIR="${d%/}" && break
done

# SKILL.md が見つからない場合は終了
if [[ -z "${SKILL_DIR}" ]]; then
  echo "[ERROR] SKILL.md が見つかりません: ${ROOT_DIR} 直下を確認してください"
  exit 1
fi

SKILL_NAME="$(basename "${SKILL_DIR}")"
echo "[INFO] スキル検出: ${SKILL_NAME} (${SKILL_DIR})"

# ─── Step 2: スキルディレクトリのファイル一覧を表示 ───
echo ""
echo "[INFO] ファイル一覧:"
find "${SKILL_DIR}" -type f | sort | sed "s|${ROOT_DIR}/||"

# ─── --zip モード: dist/<name>-YYMMDD-HHMM.zip を生成して終了 ───
if [[ "${1:-}" == "--zip" ]]; then
  TIMESTAMP="$(date '+%y%m%d-%H%M')"
  DIST_DIR="${ROOT_DIR}/dist"
  ZIP_PATH="${DIST_DIR}/${SKILL_NAME}-${TIMESTAMP}.zip"

  mkdir -p "${DIST_DIR}"
  # ZIP はリポジトリルートから相対パスで格納する
  (cd "${ROOT_DIR}" && zip -r "${ZIP_PATH}" "${SKILL_NAME}/" --exclude "*.DS_Store")
  echo ""
  echo "[OK] ZIP 生成完了: ${ZIP_PATH}"
  exit 0
fi

# ─── 通常モード: ~/.claude/skills へコピーするか確認 ───
INSTALL_DIR="${HOME}/.claude/skills"
echo ""
printf "[CONFIRM] %s を %s へコピーしますか？ [y/N] " "${SKILL_NAME}" "${INSTALL_DIR}"
read -r answer

if [[ "${answer}" =~ ^[Yy]$ ]]; then
  mkdir -p "${INSTALL_DIR}"
  cp -r "${SKILL_DIR}" "${INSTALL_DIR}/"
  echo "[OK] インストール完了: ${INSTALL_DIR}/${SKILL_NAME}"
else
  echo "[INFO] コピーをスキップしました"
fi
