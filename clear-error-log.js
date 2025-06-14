/**
 * Script to clear error logs
 * This script is called when an error is detected in the drawdown scripts
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

// Set variables
const LOG_FILE = 'error_log.txt';
const ARCHIVE_DIR = 'error_logs_archive';
const TIMESTAMP = new Date().toISOString().replace(/:/g, '').replace(/\..+/, '').replace('T', '_');

/**
 * Main function to clear error logs
 */
async function clearErrorLogs() {
  try {
    // Create archive directory if it doesn't exist
    if (!await fs.pathExists(ARCHIVE_DIR)) {
      await fs.mkdir(ARCHIVE_DIR);
      console.log(`Created archive directory: ${ARCHIVE_DIR}`);
    }

    // Check if error log file exists
    if (await fs.pathExists(LOG_FILE)) {
      // Archive the error log with timestamp
      const archiveFile = path.join(ARCHIVE_DIR, `error_log_${TIMESTAMP}.txt`);
      await fs.copy(LOG_FILE, archiveFile);
      console.log(chalk.yellow(`Error log archived to ${archiveFile}`));

      // Clear the error log file (keep the file but remove contents)
      await fs.writeFile(LOG_FILE, '');
      console.log(chalk.green('Error log file cleared'));
    } else {
      console.log(chalk.yellow('No error log file found'));
      // Create an empty error log file
      await fs.writeFile(LOG_FILE, '');
      console.log(chalk.green('New error log file created'));
    }

    console.log(chalk.green('Error log processing completed'));
  } catch (error) {
    console.error(chalk.red(`Error processing logs: ${error.message}`));
    process.exit(1);
  }
}

// Execute the main function if this script is run directly
if (require.main === module) {
  clearErrorLogs();
}

// Export the function for use in other scripts
module.exports = { clearErrorLogs };