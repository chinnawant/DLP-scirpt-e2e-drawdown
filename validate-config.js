/**
 * Script to validate config.json file
 * This script checks that all required fields are present in the config.json file
 */

const fs = require('fs-extra');
const { colors } = require('./utils');

/**
 * Main function to validate config.json
 */
async function validateConfig() {
  try {
    console.log('Validating config.json...');
    
    const configFile = 'config.json';
    
    // Check if config file exists
    if (!await fs.pathExists(configFile)) {
      console.log(colors.red('Error: config.json not found.'));
      process.exit(1);
    }
    
    // Read and parse config file
    let config;
    try {
      const configData = await fs.readFile(configFile, 'utf8');
      config = JSON.parse(configData);
    } catch (error) {
      console.log(colors.red(`Error: Invalid JSON in config.json - ${error.message}`));
      process.exit(1);
    }
    
    // Check required fields for KTB
    console.log('Checking required fields for KTB...');
    const ktbRequiredFields = [
      'base_url',
      'loc_account_no',
      'disburse_amount',
      'to_account_no',
      'product_market_code',
      'selected_plan_id'
    ];
    
    if (!config.ktb) {
      console.log(colors.red('Error: Missing ktb section in config.json'));
      process.exit(1);
    }
    
    for (const field of ktbRequiredFields) {
      if (config.ktb[field] === undefined) {
        console.log(colors.red(`Error: Missing ktb.${field} in config.json`));
        process.exit(1);
      }
    }
    
    // Check required fields for VB
    console.log('Checking required fields for VB...');
    const vbRequiredFields = [
      'base_url',
      'loc_account_no',
      'disburse_amount',
      'to_account_no',
      'product_market_code',
      'selected_plan_id',
      'ccd_id',
      'drawdown_type'
    ];
    
    if (!config.vb) {
      console.log(colors.red('Error: Missing vb section in config.json'));
      process.exit(1);
    }
    
    for (const field of vbRequiredFields) {
      if (config.vb[field] === undefined) {
        console.log(colors.red(`Error: Missing vb.${field} in config.json`));
        process.exit(1);
      }
    }
    
    // Check drawdown_type value
    if (config.vb.drawdown_type !== 'Saving' && config.vb.drawdown_type !== 'bill') {
      console.log(colors.red(`Error: Invalid vb.drawdown_type value: ${config.vb.drawdown_type}. Must be 'Saving' or 'bill'.`));
      process.exit(1);
    }
    
    console.log(colors.green('config.json is valid.'));
    return true;
  } catch (error) {
    console.log(colors.red(`Unhandled error: ${error.message}`));
    process.exit(1);
  }
}

// Execute the main function if this script is run directly
if (require.main === module) {
  validateConfig();
}

// Export the function for use in other scripts
module.exports = { validateConfig };