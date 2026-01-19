#!/bin/bash

# Package extension for Chrome Web Store submission
# Run from the extension directory: ./store/package.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$SCRIPT_DIR/dist"
ZIP_NAME="aem-generative-websites.zip"

echo "Packaging AEM Generative Websites extension..."
echo "Extension directory: $EXT_DIR"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Remove old package if exists
rm -f "$OUTPUT_DIR/$ZIP_NAME"

# Create zip excluding store assets and dev files
cd "$EXT_DIR"
zip -r "$OUTPUT_DIR/$ZIP_NAME" . \
  -x "store/*" \
  -x "*.DS_Store" \
  -x ".git/*" \
  -x "node_modules/*" \
  -x "*.md" \
  -x "*.log"

echo ""
echo "Package created: $OUTPUT_DIR/$ZIP_NAME"
echo ""

# Show package contents
echo "Package contents:"
unzip -l "$OUTPUT_DIR/$ZIP_NAME" | head -30

# Show file size
SIZE=$(ls -lh "$OUTPUT_DIR/$ZIP_NAME" | awk '{print $5}')
echo ""
echo "Package size: $SIZE"
echo ""
echo "Ready for Chrome Web Store upload!"
