/**
 * Script for DCB Lending System - KTB Account Deletion
 * This script deletes account records from both orch_loan_account_creation and proc_loan_account databases
 * where contract_ref_id matches the KTB contract_ref_id from config.json
 */

const {
  colors,
  loadConfig,
} = require('./utils');
const {
  connectToDatabase,
  deleteAccount
} = require('./database');

/**
 * Main function to execute the KTB account deletion
 */
async function ktbDeleteAccount() {
  let orchClient = null;
  let procClient = null;

  try {
    // Load configuration
    const config = await loadConfig();
    const contractRefId = config.ktb.contract_ref_id;

    if (!contractRefId) {
      console.log(colors.red('Error: No contract_ref_id found in config.json'));
      process.exit(1);
    }

    console.log(colors.green('===== KTB Account Deletion ====='));
    console.log(colors.yellow(`Deleting account with contract_ref_id: ${contractRefId}`));

    // Connect to both databases
    orchClient = await connectToDatabase('orch_loan_account_creation', 'ktb');
    procClient = await connectToDatabase('proc_loan_account', 'ktb');

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
  ktbDeleteAccount();
}

// Export the function for use in other scripts
module.exports = { ktbDeleteAccount };
