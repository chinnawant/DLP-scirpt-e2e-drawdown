/**
 * Script for DCB Lending System - VB Smart Contract Update
 * This script updates the PostgreSQL database tables and deletes Redis data for VB
 * 1. Updates proc_loan_account and loan_smart_contract tables in public schema
 * 2. Deletes data in Redis with key LOAN_SMART_CONTRACT:Revolving_Loan
 */

const { Client } = require('pg');
const redis = require('redis');
const { promisify } = require('util');
const {
  colors,
  loadConfig,
} = require('./utils');

/**
 * Connect to a PostgreSQL database for VB
 * @param {string} database - Database name
 * @returns {Promise<Client>} PostgreSQL client
 */
async function connectToDatabase(database) {
  // Load configuration
  const config = await loadConfig();

  // Connection details from config.json with environment variables as fallback
  const client = new Client({
    host: config.vb.db_host || process.env.DB_HOST,
    port: config.vb.db_port || process.env.DB_PORT,
    database: database,
    user: config.vb.db_user || process.env.DB_USER,
    password: config.vb.db_password || process.env.DB_PASSWORD,
    schema: 'public'
  });

  try {
    await client.connect();
    console.log(colors.green(`Connected to VB ${database} database`));
    return client;
  } catch (error) {
    console.log(colors.red(`Error connecting to VB ${database} database: ${error.message}`));
    throw error;
  }
}

/**
 * Update loan_smart_contract table
 * @param {Client} client - PostgreSQL client
 * @param {string} supervisorContractId - Supervisor contract ID
 * @param {string} locSmartContractId - LOC smart contract ID
 * @param {string} drawdownSmartContractId - Drawdown smart contract ID
 * @returns {Promise<number>} Number of updated rows
 */
async function updateLoanSmartContract(client, supervisorContractId, locSmartContractId, drawdownSmartContractId) {
  try {
    const query = {
      text: `UPDATE public.loan_smart_contract 
             SET loc_smart_contract_id = $1, 
                 drawdown_smart_contract_id = $2 
             WHERE supervisor_contract_id = $3`,
      values: [locSmartContractId, drawdownSmartContractId, supervisorContractId],
    };

    const result = await client.query(query);
    console.log(colors.green(`Updated ${result.rowCount} rows in VB public.loan_smart_contract`));
    return result.rowCount;
  } catch (error) {
    console.log(colors.red(`Error updating VB loan_smart_contract: ${error.message}`));
    throw error;
  }
}

/**
 * Update proc_loan_account table
 * @param {Client} client - PostgreSQL client
 * @param {string} supervisorContractId - Supervisor contract ID
 * @param {string} locSmartContractId - LOC smart contract ID
 * @param {string} drawdownSmartContractId - Drawdown smart contract ID
 * @returns {Promise<number>} Number of updated rows
 */
async function updateProcLoanAccount(client, supervisorContractId, locSmartContractId, drawdownSmartContractId) {
  try {
    const query = {
      text: `UPDATE public.proc_loan_account 
             SET loc_smart_contract_id = $1, 
                 drawdown_smart_contract_id = $2 
             WHERE supervisor_contract_id = $3`,
      values: [locSmartContractId, drawdownSmartContractId, supervisorContractId],
    };

    const result = await client.query(query);
    console.log(colors.green(`Updated ${result.rowCount} rows in VB public.proc_loan_account`));
    return result.rowCount;
  } catch (error) {
    console.log(colors.red(`Error updating VB proc_loan_account: ${error.message}`));
    throw error;
  }
}

/**
 * Delete data from Redis
 * @param {string} redisHost - Redis host
 * @param {number} redisPort - Redis port
 * @param {string} redisKey - Redis key to delete
 * @returns {Promise<void>}
 */
async function deleteRedisData(redisHost, redisPort, redisKey) {
  const client = redis.createClient({
    host: redisHost,
    port: redisPort
  });

  // Promisify Redis client methods
  const delAsync = promisify(client.del).bind(client);
  const quitAsync = promisify(client.quit).bind(client);

  try {
    // Connect to Redis
    client.on('error', (err) => {
      console.log(colors.red(`Redis Error: ${err}`));
    });

    client.on('connect', () => {
      console.log(colors.green('Connected to Redis'));
    });

    // Delete the key
    const result = await delAsync(redisKey);
    console.log(colors.green(`Deleted Redis key ${redisKey}: ${result === 1 ? 'Success' : 'Key not found'}`));
  } catch (error) {
    console.log(colors.red(`Error deleting Redis data: ${error.message}`));
    throw error;
  } finally {
    // Close Redis connection
    await quitAsync();
    console.log(colors.green('Closed Redis connection'));
  }
}

/**
 * Main function to execute the VB smart contract update
 */
async function vbUpdateSmartContract() {
  let procClient = null;

  try {
    // Load configuration
    const config = await loadConfig();

    // Get parameters from config.json under vb section
    const supervisorContractId = config.vb.supervisorContractId;
    const locSmartContractId = config.vb.locSmartContractId;
    const drawdownSmartContractId = config.vb.drawdownSmartContractId;

    // Redis configuration (from config.json with environment variables as fallback)
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = process.env.REDIS_PORT || 6379;
    const redisKey = config.vb.redisKey;

    console.log(colors.green('===== VB Smart Contract Update ====='));
    console.log(colors.yellow(`Updating with supervisor_contract_id: ${supervisorContractId}`));
    console.log(colors.yellow(`Setting loc_smart_contract_id: ${locSmartContractId}`));
    console.log(colors.yellow(`Setting drawdown_smart_contract_id: ${drawdownSmartContractId}`));

    // Connect to database
    procClient = await connectToDatabase('proc_loan_account');

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
    console.log(colors.green('===== VB Update Summary ====='));
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
        console.log(colors.green('Closed connection to VB proc_loan_account database'));
      } catch (error) {
        console.log(colors.red(`Error closing VB proc_loan_account connection: ${error.message}`));
      }
    }
  }
}

// Execute the main function if this script is run directly
if (require.main === module) {
  vbUpdateSmartContract();
}

// Export the function for use in other scripts
module.exports = { vbUpdateSmartContract };
