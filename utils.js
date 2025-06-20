/**
 * Utility functions for DCB Lending System API Scripts
 */

const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');
const axios = require('axios');
const path = require('path');
const { clearErrorLogs } = require('./clear-error-log');

// Colors for output
const colors = {
  green: chalk.green,
  red: chalk.red,
  yellow: chalk.yellow
};

// Default log file path
const DEFAULT_LOG_DIR = 'logs';
const DEFAULT_LOG_FILE = 'console.log';
let logFilePath = path.join(DEFAULT_LOG_DIR, DEFAULT_LOG_FILE);
let isLoggingEnabled = false;

// Store original console.log function
const originalConsoleLog = console.log;

/**
 * Generate a new request ID using UUID
 * @returns {string} UUID v4
 */
function generateRequestId() {
  return uuidv4();
}

/**
 * Generate a trace parent UUID in the format required by the API
 * @returns {string} Trace parent UUID
 */
function generateTraceParentUuid() {
  const uuid1 = uuidv4().replace(/-/g, '').substring(0, 32);
  const uuid2 = uuidv4().replace(/-/g, '').substring(0, 16);
  return `00-${uuid1}-${uuid2}-01`;
}


/**
 * Check response and extract values
 * @param {object} response - Response object
 * @param {string} key - JSON path to extract
 * @param {string} defaultValue - Default value if extraction fails
 * @param {string} varName - Variable name for logging
 * @returns {string} Extracted value or default value
 */
async function checkResponse(response, key, defaultValue, varName) {
  try {
    // Check if response contains an error
    const errorCode = response?.data?.code || '';
    const errorMessage = response?.data?.message || '';

    if (errorCode !== '0000' && errorCode !== '') {
      console.log(colors.red(`Error in response: Code ${errorCode} - ${errorMessage}`));

      // Log error to file
      const logFile = 'error_log.txt';
      await fs.appendFile(
        logFile, 
        `${new Date().toISOString()}: Error in ${varName} - Code ${errorCode} - ${errorMessage}\n` +
        `Response: ${JSON.stringify(response.data)}\n`
      );

      // Run script to clear log error
      await clearErrorLogs();

      // Break execution
      console.log(colors.red('Breaking execution due to error'));
      process.exit(1);
    }

    // Extract the value using the key path
    let extractedValue = response.data;
    const keyParts = key.split('.').filter(part => part !== '');

    for (const part of keyParts) {
      if (extractedValue && typeof extractedValue === 'object') {
        extractedValue = extractedValue[part];
      } else {
        extractedValue = defaultValue;
        break;
      }
    }

    // Check if default value is being used
    if (extractedValue === defaultValue) {
      console.log(colors.yellow(`Warning: Using default value for ${varName} because it couldn't be extracted from the response`));
    }

    return extractedValue;
  } catch (error) {
    console.log(colors.red(`Error extracting value: ${error.message}`));

    // Log error to file
    const logFile = 'error_log.txt';
    await fs.appendFile(
      logFile, 
      `${new Date().toISOString()}: Network error in ${varName} - ${error.message}\n`
    );

    // Run script to clear log error
    await clearErrorLogs();

    // Return default value instead of breaking execution
    console.log(colors.yellow(`Continuing execution with default value for ${varName}`));
    return defaultValue;
  }
}

/**
 * Make API request with error handling
 * @param {string} method - HTTP method
 * @param {string} url - API endpoint URL
 * @param {object} headers - Request headers
 * @param {object} data - Request body
 * @returns {Promise<object>} Response object
 */
async function makeApiRequest(method, url, headers, data) {
  try {
    const https = require('https');
    const response = await axios({
      method,
      url,
      headers,
      data,
      validateStatus: () => true, // Don't throw on any status code
      httpsAgent: new https.Agent({  
        rejectUnauthorized: false // Allow self-signed certificates
      }),
    });


    return response;
  } catch (error) {
    console.log(colors.red(`Network error: ${error.message}`));

    // Log error to file
    const logFile = 'error_log.txt';
    await fs.appendFile(
      logFile, 
      `${new Date().toISOString()}: Network error - ${error.message}\n`
    );

    // Run script to clear log error
    await clearErrorLogs();

    // Return a mock response to allow execution to continue
    return {
      data: {
        code: 'NETWORK_ERROR',
        message: error.message
      }
    };
  }
}

/**
 * Load configuration from config.json
 * @returns {Promise<object>} Configuration object
 */
async function loadConfig() {
  try {
    const configFile = 'config.json';

    // Check if config file exists
    if (!await fs.pathExists(configFile)) {
      console.log(colors.red(`Error: Config file ${configFile} not found`));
      process.exit(1);
    }

    // Read and parse config file
    const configData = await fs.readFile(configFile, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.log(colors.red(`Error loading config: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Update configuration in config.json
 * @param {string} section - Section in config (e.g., 'ktb')
 * @param {string} key - Key to update
 * @param {any} value - Value to set
 * @returns {Promise<void>}
 */
async function updateConfig(section, key, value) {
  try {
    const configFile = 'config.json';

    // Load current config
    const config = await loadConfig();

    // Update the specified key
    if (!config[section]) {
      config[section] = {};
    }

    config[section][key] = value;

    // Write updated config back to file
    await fs.writeFile(configFile, JSON.stringify(config, null, 2), 'utf8');

    console.log(colors.green(`Updated config: ${section}.${key} = ${value}`));
  } catch (error) {
    console.log(colors.red(`Error updating config: ${error.message}`));
  }
}

/**
 * Enable logging to file
 * @param {string} [logDir=DEFAULT_LOG_DIR] - Directory to store log files
 * @param {string} [logFile=DEFAULT_LOG_FILE] - Log file name
 * @param {boolean} [createTimestampedFile=false] - Whether to create a timestamped log file
 * @param {string} [locAccountNo=null] - LOC account number to include in the filename
 * @returns {Promise<void>}
 */
async function enableFileLogging(logDir = DEFAULT_LOG_DIR, logFile = DEFAULT_LOG_FILE, createTimestampedFile = false, locAccountNo = null) {
  try {
    // Create logs directory if it doesn't exist
    await fs.ensureDir(logDir);

    // Create timestamped filename if requested
    if (createTimestampedFile) {
      const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
      const fileNameParts = logFile.split('.');
      const ext = fileNameParts.pop();
      const name = fileNameParts.join('.');

      // If locAccountNo is provided, use the format loc_account_no-timestamp
      if (locAccountNo) {
        logFile = `${locAccountNo}-${timestamp}.${ext}`;
      } else {
        logFile = `${name}-${timestamp}.${ext}`;
      }
    }

    logFilePath = path.join(logDir, logFile);

    // Create or clear the log file
    await fs.writeFile(logFilePath, `=== Log started at ${new Date().toISOString()} ===\n\n`);

    // Override console.log
    console.log = function(...args) {
      // Call original console.log
      originalConsoleLog(...args);

      // Write to log file
      const logMessage = args.map(arg => {
        if (typeof arg === 'object') {
          return JSON.stringify(arg, null, 2);
        }
        return String(arg);
      }).join(' ') + '\n';

      fs.appendFileSync(logFilePath, logMessage);
    };

    isLoggingEnabled = true;
    console.log(colors.green(`File logging enabled. Logs will be written to: ${logFilePath}`));

    return logFilePath;
  } catch (error) {
    originalConsoleLog(colors.red(`Error enabling file logging: ${error.message}`));
    // Don't override console.log if there was an error
    return null;
  }
}

/**
 * Disable logging to file and restore original console.log
 */
function disableFileLogging() {
  if (isLoggingEnabled) {
    console.log = originalConsoleLog;
    console.log(colors.yellow(`File logging disabled. Log file: ${logFilePath}`));
    isLoggingEnabled = false;
  }
}

/**
 * Get the current log file path
 * @returns {string|null} Current log file path or null if logging is disabled
 */
function getLogFilePath() {
  return isLoggingEnabled ? logFilePath : null;
}

module.exports = {
  colors,
  generateRequestId,
  generateTraceParentUuid,
  checkResponse,
  makeApiRequest,
  loadConfig,
  updateConfig,
  enableFileLogging,
  disableFileLogging,
  getLogFilePath
};
