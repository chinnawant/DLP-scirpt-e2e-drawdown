/**
 * Script for DCB Lending System - KTB Balance Inquiry
 * This script performs a balance inquiry for a KTB loan account
 * 
 * Flow Overview:
 * 1. Query database to get tm_account_id from proc_loan_account.loan_account where contract_ref_id matches config
 * 2. Make a balance inquiry request to the lending processor service
 */

const { Client } = require('pg');
const {
  colors,
  generateRequestId,
  generateTraceParentUuid,
  makeApiRequest,
  loadConfig
} = require('./utils');

/**
 * Connect to a PostgreSQL database
 * @param {string} database - Database name
 * @returns {Promise<Client>} PostgreSQL client
 */
async function connectToDatabase(database) {
  // Load configuration
  const config = await loadConfig();

  // Connection details from config.json
  const client = new Client({
    host: config.ktb.db_host,
    port: config.ktb.db_port,
    database: database,
    user: config.ktb.db_user,
    password: config.ktb.db_password,
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
 * Get tm_account_id from the database
 * @param {Client} client - PostgreSQL client
 * @param {string} contractRefId - Contract reference ID
 * @returns {Promise<string>} tm_account_id
 */
async function getTmAccountId(client, contractRefId) {
  try {
    const query = {
      text: 'SELECT tm_account_id FROM public.loan_account WHERE contract_ref_id = $1',
      values: [contractRefId],
    };

    const result = await client.query(query);
    
    if (result.rows.length === 0) {
      console.log(colors.red(`No account found with contract_ref_id: ${contractRefId}`));
      throw new Error(`No account found with contract_ref_id: ${contractRefId}`);
    }

    const tmAccountId = result.rows[0].tm_account_id;
    console.log(colors.green(`Found tm_account_id: ${tmAccountId}`));
    return tmAccountId;
  } catch (error) {
    console.log(colors.red(`Error querying database: ${error.message}`));
    throw error;
  }
}

/**
 * Main function to execute the KTB balance inquiry
 */
async function ktbBalanceInquiry() {
  let procClient = null;

  try {
    // Load configuration
    const config = await loadConfig();
    const contractRefId = config.ktb.contract_ref_id;

    if (!contractRefId) {
      console.log(colors.red('Error: No contract_ref_id found in config.json'));
      process.exit(1);
    }

    console.log(colors.green('===== KTB Balance Inquiry ====='));
    console.log(colors.yellow(`Checking balance for contract_ref_id: ${contractRefId}`));

    // Step 1: Connect to database and get tm_account_id
    console.log(colors.green('===== Step 1: Get tm_account_id from Database ====='));
    procClient = await connectToDatabase('proc_loan_account');
    const tmAccountId = await getTmAccountId(procClient, contractRefId);

    // Step 2: Make balance inquiry request
    console.log(colors.green('===== Step 2: Balance Inquiry Request ====='));
    console.log(colors.yellow(`Calling POST http://proc-lending-account.lending-processor.svc.cluster.local:8080/dcb/lending-internal/v1/proc-account/balance/inquiry`));

    const requestId = generateRequestId();
    console.log(colors.yellow(`Using request ID: ${requestId}`));

    const traceParentUuid = generateTraceParentUuid();
    console.log(colors.yellow(`Using trace parent: ${traceParentUuid}`));

    // Prepare request body
    const requestBody = {
      accountIds: [
        {
          tmAccountId: tmAccountId,
          accountType: "LOC_ACCOUNT"
        }
      ]
    };

    console.log(colors.yellow('Request Body:'));
    console.log(JSON.stringify(requestBody, null, 2));

    // Make API request
    const response = await makeApiRequest(
      'post',
      'http://proc-lending-account.lending-processor.svc.cluster.local:8080/dcb/lending-internal/v1/proc-account/balance/inquiry',
      {
        'Content-Type': 'application/json',
        'X-Channel-Id': 'bib',
        'X-Request-Id': requestId,
        'X-Requester': '',
        'X-Traceparent': traceParentUuid
      },
      requestBody
    );

    // Print summary
    console.log(colors.green('===== Balance Inquiry Summary ====='));
    console.log(colors.yellow(`Contract Reference ID: ${contractRefId}`));
    console.log(colors.yellow(`TM Account ID: ${tmAccountId}`));
    console.log(colors.green('===== End of Summary ====='));

  } catch (error) {
    console.log(colors.red(`Unhandled error: ${error.message}`));
    process.exit(1);
  } finally {
    // Close database connection
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
  ktbBalanceInquiry();
}

// Export the function for use in other scripts
module.exports = { ktbBalanceInquiry };