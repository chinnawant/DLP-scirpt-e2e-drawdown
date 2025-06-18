/**
 * Database utility functions for DCB Lending System
 * This module provides functions for database operations
 */

const { Client } = require('pg');
const fs = require('fs-extra');
const path = require('path');
const redis = require('redis');
const { promisify } = require('util');
const { colors, loadConfig } = require('./utils');

/**
 * Connect to a PostgreSQL database
 * @param {string} database - Database name
 * @param {string} bank - Bank code (ktb or vb)
 * @returns {Promise<Client>} PostgreSQL client
 */
async function connectToDatabase(database, bank = 'ktb') {
  // Load configuration
  const config = await loadConfig();

  // Use the appropriate bank configuration
  const bankConfig = config[bank.toLowerCase()];

  if (!bankConfig) {
    throw new Error(`Bank configuration for ${bank} not found`);
  }

  // Connection details from config.json with environment variables as fallback
  const client = new Client({
    host: bankConfig.db_host || process.env.DB_HOST,
    port: bankConfig.db_port || process.env.DB_PORT,
    database: database,
    user: bankConfig.db_user || process.env.DB_USER,
    password: bankConfig.db_password || process.env.DB_PASSWORD,
    schema: 'public'
  });

  try {
    await client.connect();
    console.log(colors.green(`Connected to ${bank.toUpperCase()} ${database} database`));
    return client;
  } catch (error) {
    console.log(colors.red(`Error connecting to ${bank.toUpperCase()} ${database} database: ${error.message}`));
    throw error;
  }
}



/**
 * Query loan_smart_contract table
 * @param {Client} client - PostgreSQL client
 * @param {string} contractRefId - Contract reference ID
 * @returns {Promise<object>} Query result
 */
async function queryLoanSmartContract(client, contractRefId) {
  try {
    const query = {
      text: `SELECT * FROM public.loan_smart_contract WHERE contract_ref_id = $1`,
      values: [contractRefId],
    };

    const result = await client.query(query);
    console.log(colors.green(`Retrieved ${result.rowCount} rows from public.loan_smart_contract`));
    return result;
  } catch (error) {
    console.log(colors.red(`Error querying loan_smart_contract: ${error.message}`));
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
 * Save query results to a file
 * @param {object} data - Data to save
 * @param {string} filename - Filename to save to
 * @returns {Promise<void>}
 */
async function saveResultsToFile(data, filename) {
  try {
    // Create directory if it doesn't exist
    const dir = path.dirname(filename);
    await fs.ensureDir(dir);

    // Write data to file
    await fs.writeFile(filename, JSON.stringify(data, null, 2), 'utf8');
    console.log(colors.green(`Saved query results to ${filename}`));
  } catch (error) {
    console.log(colors.red(`Error saving results to file: ${error.message}`));
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
    console.log(colors.green(`Updated ${result.rowCount} rows in public.loan_smart_contract`));
    return result.rowCount;
  } catch (error) {
    console.log(colors.red(`Error updating loan_smart_contract: ${error.message}`));
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
    console.log(colors.green(`Updated ${result.rowCount} rows in public.proc_loan_account`));
    return result.rowCount;
  } catch (error) {
    console.log(colors.red(`Error updating proc_loan_account: ${error.message}`));
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

  const delAsync = promisify(client.del).bind(client);
  const quitAsync = promisify(client.quit).bind(client);

  try {
    console.log(colors.yellow(`Connecting to Redis at ${redisHost}:${redisPort}`));
    console.log(colors.yellow(`Deleting key: ${redisKey}`));

    const result = await delAsync(redisKey);
    console.log(colors.green(`Deleted ${result} keys from Redis`));
  } catch (error) {
    console.log(colors.red(`Error deleting Redis data: ${error.message}`));
    throw error;
  } finally {
    await quitAsync();
    console.log(colors.green('Closed Redis connection'));
  }
}

module.exports = {
  connectToDatabase,
  queryLoanSmartContract,
  deleteAccount,
  saveResultsToFile,
  updateLoanSmartContract,
  updateProcLoanAccount,
  deleteRedisData
};
