#!/bin/sh

# Entry script for the container: optional override of websiteName in config.json
# If WEBSITE_NAME env var is set, replace the value in /usr/share/nginx/html/config.json

CONFIG_FILE=/usr/share/nginx/html/config.json

if [ -n "$WEBSITE_NAME" ] && [ -f "$CONFIG_FILE" ]; then
  # Escape slashes & ampersands from env var to safely use in sed replacement
  # Use awk to safely replace the websiteName value in JSON
  awk -v name="$WEBSITE_NAME" '{ gsub(/"websiteName"[[:space:]]*:[[:space:]]*"[^"]*"/, "\"websiteName\": \"" name "\""); print }' "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
  echo "Overrode websiteName in config.json to: $WEBSITE_NAME"
fi

# Start nginx
exec "$@"
