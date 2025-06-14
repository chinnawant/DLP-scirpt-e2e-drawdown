/**
 * Script for DCB Lending System - VB Account Deletion
 * This script deletes account records from both orch_loan_account_creation and proc_loan_account databases
 * where contract_ref_id matches the VB contract_ref_id from config.json
 */

const { Client } = require('pg');
const {
  colors,
  loadConfig,
} = require('./utils');

/**
 * Connect to a PostgreSQL database
 * @param {string} database - Database name
 * @returns {Promise<Client>} PostgreSQL client
 */
async function connectToDatabase(database) {
  // Load configuration
  const config = await loadConfig();

  // Connection details from config.json with environment variables as fallback
  const client = new Client({
    host:  config.vb.db_host ,
    port: config.vb.db_port,
    database: database,
    user: config.vb.db_user ,
    password: config.vb.db_password,
    schema: 'public'
  });

  try {
    await client.connect();
    console.log(colors.green(`Connected to ${database} database`));
    return client;
  } catch (error) {
    console.log(colors.red(`Error connecting to ${database} database: ${error.message}`));
    throw error;
  }
}

/**
 * Delete account record from a database
 * @param {Client} client - PostgreSQL client
 * @param {string} contractRefId - Contract reference ID
 * @param {string} databaseName - Database name for logging
 * @returns {Promise<number>} Number of deleted rows
 */
async function deleteAccount(client, contractRefId, databaseName) {
  try {
    const query = {
      text: 'DELETE FROM public.loan_account WHERE contract_ref_id = $1',
      values: [contractRefId],
    };

    const result = await client.query(query);
    console.log(colors.green(`Deleted ${result.rowCount} rows from ${databaseName}.public.loan_account`));
    return result.rowCount;
  } catch (error) {
    console.log(colors.red(`Error deleting from ${databaseName}: ${error.message}`));
    throw error;
  }
}

/**
 * Main function to execute the VB account deletion
 */
async function vbDeleteAccount() {
  let orchClient = null;
  let procClient = null;

  try {
    // Load configuration
    const config = await loadConfig();
    const contractRefId = config.vb.contract_ref_id;

    if (!contractRefId) {
      console.log(colors.red('Error: No contract_ref_id found in config.json'));
      process.exit(1);
    }

    console.log(colors.green('===== VB Account Deletion ====='));
    console.log(colors.yellow(`Deleting account with contract_ref_id: ${contractRefId}`));

    // Connect to both databases
    orchClient = await connectToDatabase('orch_loan_account_creation');
    procClient = await connectToDatabase('proc_loan_account');

    // Delete from both databases
    const orchDeleteCount = await deleteAccount(orchClient, contractRefId, 'orch_loan_account_creation');
    const procDeleteCount = await deleteAccount(procClient, contractRefId, 'proc_loan_account');

    // Print summary
    console.log(colors.green('===== Account Deletion Summary ====='));
    console.log(colors.yellow(`Contract Reference ID: ${contractRefId}`));
    console.log(colors.yellow(`Deleted from orch_loan_account_creation: ${orchDeleteCount} rows`));
    console.log(colors.yellow(`Deleted from proc_loan_account: ${procDeleteCount} rows`));
    console.log(colors.green('===== End of Summary ====='));

  } catch (error) {
    console.log(colors.red(`Unhandled error: ${error.message}`));
    process.exit(1);
  } finally {
    // Close database connections
    if (orchClient) {
      try {
        await orchClient.end();
        console.log(colors.green('Closed connection to orch_loan_account_creation database'));
      } catch (error) {
        console.log(colors.red(`Error closing orch_loan_account_creation connection: ${error.message}`));
      }
    }

    if (procClient) {
      try {
        await procClient.end();
        console.log(colors.green('Closed connection to proc_loan_account database'));
      } catch (error) {
        console.log(colors.red(`Error closing proc_loan_account connection: ${error.message}`));
      }
    }
  }
}

// Execute the main function if this script is run directly
if (require.main === module) {
  vbDeleteAccount();
}

// Export the function for use in other scripts
module.exports = { vbDeleteAccount };