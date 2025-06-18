/**
 * Script for DCB Lending System - KTB Smart Contract Update
 * This script updates the PostgreSQL database tables and deletes Redis data for KTB
 * 1. Updates proc_loan_account and loan_smart_contract tables in public schema
 * 2. Deletes data in Redis with key LOAN_SMART_CONTRACT:Revolving_Loan
 */

const {
  colors,
  loadConfig,
} = require('./utils');
const {
  connectToDatabase,
  updateLoanSmartContract,
  updateProcLoanAccount,
  deleteRedisData
} = require('./database');





/**
 * Main function to execute the KTB smart contract update
 */
async function ktbUpdateSmartContract() {
  let procClient = null;

  try {
    // Load configuration
    const config = await loadConfig();

    // Get parameters from config.json under ktb section
    const supervisorContractId = config.ktb.supervisorContractId;
    const locSmartContractId = config.ktb.locSmartContractId;
    const drawdownSmartContractId = config.ktb.drawdownSmartContractId;

    // Redis configuration (from config.json with environment variables as fallback)
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = process.env.REDIS_PORT || 6379;
    const redisKey = config.ktb.redisKey;

    console.log(colors.green('===== KTB Smart Contract Update ====='));
    console.log(colors.yellow(`Updating with supervisor_contract_id: ${supervisorContractId}`));
    console.log(colors.yellow(`Setting loc_smart_contract_id: ${locSmartContractId}`));
    console.log(colors.yellow(`Setting drawdown_smart_contract_id: ${drawdownSmartContractId}`));

    // Connect to database
    procClient = await connectToDatabase('proc_loan_account', 'ktb');

    // Update tables
    const procUpdateCount = await updateProcLoanAccount(
      procClient, 
      supervisorContractId, 
      locSmartContractId, 
      drawdownSmartContractId
    );

    const smartContractUpdateCount = await updateLoanSmartContract(
      procClient, 
      supervisorContractId, 
      locSmartContractId, 
      drawdownSmartContractId
    );

    // Delete Redis data
    await deleteRedisData(redisHost, redisPort, redisKey);

    // Print summary
    console.log(colors.green('===== KTB Update Summary ====='));
    console.log(colors.yellow(`Supervisor Contract ID: ${supervisorContractId}`));
    console.log(colors.yellow(`Updated proc_loan_account: ${procUpdateCount} rows`));
    console.log(colors.yellow(`Updated loan_smart_contract: ${smartContractUpdateCount} rows`));
    console.log(colors.yellow(`Deleted Redis key: ${redisKey}`));
    console.log(colors.green('===== End of Summary ====='));

  } catch (error) {
    console.log(colors.red(`Unhandled error: ${error.message}`));
    process.exit(1);
  } finally {
    // Close database connection
    if (procClient) {
      try {
        await procClient.end();
        console.log(colors.green('Closed connection to KTB proc_loan_account database'));
      } catch (error) {
        console.log(colors.red(`Error closing KTB proc_loan_account connection: ${error.message}`));
      }
    }
  }
}

// Execute the main function if this script is run directly
if (require.main === module) {
  ktbUpdateSmartContract();
}

// Export the function for use in other scripts
module.exports = { ktbUpdateSmartContract };
