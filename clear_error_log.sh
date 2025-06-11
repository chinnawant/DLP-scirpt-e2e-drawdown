#!/bin/bash

# Script to clear error logs
# This script is called when an error is detected in the ktb-drawdown.sh script

# Set variables
LOG_FILE="error_log.txt"
ARCHIVE_DIR="error_logs_archive"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create archive directory if it doesn't exist
if [ ! -d "$ARCHIVE_DIR" ]; then
    mkdir -p "$ARCHIVE_DIR"
    echo "Created archive directory: $ARCHIVE_DIR"
fi

# Check if error log file exists
if [ -f "$LOG_FILE" ]; then
    # Archive the error log with timestamp
    cp "$LOG_FILE" "$ARCHIVE_DIR/error_log_$TIMESTAMP.txt"
    echo "Error log archived to $ARCHIVE_DIR/error_log_$TIMESTAMP.txt"

    # Clear the error log file (keep the file but remove contents)
    > "$LOG_FILE"
    echo "Error log file cleared"
else
    echo "No error log file found"
    # Create an empty error log file
    > "$LOG_FILE"
    echo "New error log file created"
fi

echo "Error log processing completed"
