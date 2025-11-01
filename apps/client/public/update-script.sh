#!/bin/bash

# Script to update Altered TCG card data daily
# Add this to your crontab: 0 2 * * * /path/to/update-script.sh

# Configuration
API_URL="${API_URL:-http://localhost:3000/api/cards/missing/export?format=csv}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_FILE="${OUTPUT_FILE:-$SCRIPT_DIR/missing_cards.csv}"
LOG_FILE="${LOG_FILE:-$SCRIPT_DIR/update.log}"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Download the data
log "Starting data update..."

if curl -s "$API_URL" -o "$OUTPUT_FILE"; then
    log "Data updated successfully"
    log "File saved to: $OUTPUT_FILE"
else
    log "ERROR: Failed to download data from $API_URL"
    exit 1
fi

log "Update completed"
