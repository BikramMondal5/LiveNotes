#!/usr/bin/env bash
set -e

SOURCE_URL="https://livenotes.vercel.app/livenotes"
TARGET_DIR="${HOME}/.local/bin"

mkdir -p "${TARGET_DIR}"
TARGET_FILE="${TARGET_DIR}/livenotes"

echo ""
echo "======================================="
echo "       LiveNotes CLI Installer         "
echo "======================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)"
if [ -f "${SCRIPT_DIR}/livenotes" ]; then
  cp "${SCRIPT_DIR}/livenotes" "${TARGET_FILE}"
else
  curl -fsSL "${SOURCE_URL}" -o "${TARGET_FILE}"
fi
chmod +x "${TARGET_FILE}"

echo "[OK] LiveNotes CLI installed successfully to ${TARGET_FILE}"

if [[ ":$PATH:" != *":${TARGET_DIR}:"* ]]; then
  echo ""
  echo "Notice: Add ~/.local/bin to your PATH if not already present:"
  echo '  export PATH="$HOME/.local/bin:$PATH"'
fi

echo ""
echo "You can now run:"
echo "  livenotes -r <room_name>"
echo ""
echo "Example:"
echo "  livenotes -r 291026"
echo ""

