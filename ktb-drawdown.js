/**
 * Flow Script for DCB Lending System - KTB
 * This script demonstrates a typical lending flow by making API calls to various services
 *
 * Flow Overview:
 * 1. Drawdown Installmentation - Initiates a drawdown request with account and amount details
 * 2. Submit Plan Selection - Selects a repayment plan using the drawdown token from step 1
 * 3. Confirm to Saving - Confirms the drawdown to saving account using the drawdown token
 * 4. Get Amortization Table - Retrieves the amortization table for the drawdown
 */

const {
  colors,
  generateRequestId,
  generateTraceParentUuid,
  checkResponse,
  makeApiRequest,
  loadConfig,
  enableFileLogging,
  disableFileLogging,
  getLogFilePath
} = require('./utils');


/**
 * Main function to execute the KTB drawdown flow
 */
async function ktbDrawdown() {
  try {
    console.log(colors.green('===== Starting KTB Drawdown Process ====='));

    // Load configuration first
    console.log(colors.yellow('Loading configuration...'));
    const config = await loadConfig();
    const ktbConfig = config.ktb;
    console.log(colors.green('Configuration loaded successfully'));

    // Enable file logging with a timestamped file using loc_account_no from config
    const logDir = 'logs';
    const logFile = 'ktb-drawdown.log';
    const logPath = await enableFileLogging(logDir, logFile, true, ktbConfig.loc_account_no);
    console.log(colors.green(`File logging enabled. Logs will be written to: ${logPath}`));

    // Define request body for step 4
    const requestBody4 = {
      accountNumber: ktbConfig.loc_account_no,
      drawdownAmount: parseFloat(ktbConfig.disburse_amount).toString(),
      tenor: 0,
    };

    // Generate random UUIDs for headers
    console.log(colors.yellow('Generating request IDs and trace parent UUID...'));
    const channelTxnRefId = generateRequestId();
    const traceParentUuid = generateTraceParentUuid();
    console.log(colors.yellow(`Generated channelTxnRefId: ${channelTxnRefId}`));

    // Step 1: Drawdown Installmentation
    console.log(colors.green('===== Step 1: Drawdown Installmentation ====='));
    console.log(colors.yellow(`Calling POST ${ktbConfig.base_url}/dcb/lending/v1/drawdown/installmentation`));

    const requestId1 = generateRequestId();
    console.log(colors.yellow(`Using request ID: ${requestId1}`));

    // Prepare request body
    const requestBody1 = {
      locAccountNo: ktbConfig.loc_account_no,
      toAccountNo: ktbConfig.to_account_no,
      productMarketCode: ktbConfig.product_market_code,
      disburseAmount: parseFloat(ktbConfig.disburse_amount),
      currency: "THB",
      channelId: "KTB"
    };

    // Log request body
    console.log(colors.yellow('Step 1 - Request Body:'));
    console.log(JSON.stringify(requestBody1, null, 2));

    // Log headers
    console.log(colors.yellow('Step 1 - Request Headers:'));
    const headers1 = {
      'x-request-id': requestId1,
      'x-channel-id': ktbConfig.headers.drawdown['x-channel-id'],
      'x-traceparent': traceParentUuid,
      'x-devops-src': ktbConfig.headers.drawdown['x-devops-src'],
      'x-devops-dest': ktbConfig.headers.drawdown['x-devops-dest'],
      'x-devops-key': ktbConfig.headers.drawdown['x-devops-key'],
      'Content-Type': 'application/json'
    };
    console.log(JSON.stringify(headers1, null, 2));

    // Make API request
    console.log(colors.yellow('Step 1 - Sending request...'));
    const response1 = await makeApiRequest(
      'post',
      `${ktbConfig.base_url}/dcb/lending/v1/drawdown/installmentation`,
      headers1,
      requestBody1
    );

    // Log response
    console.log(colors.green('Step 1 - Response received:'));
    console.log(JSON.stringify(response1.data, null, 2));

    // Step 2: Submit Plan Selection
    console.log(colors.green('===== Step 2: Submit Plan Selection ====='));

    // Extract drawdownToken from step 1 response
    console.log(colors.yellow('Step 2 - Extracting drawdownToken from Step 1 response...'));
    const drawdownToken = await checkResponse(response1, 'data.drawdownToken', '', 'DRAWDOWN_TOKEN');

    const resp1Data = response1.data.data.installmentPlan[parseInt(ktbConfig.selected_plan_id)];
    requestBody4.tenor = resp1Data.tenor.toString();
    console.log(colors.yellow(`Step 2 - Selected plan tenor: ${requestBody4.tenor}`));

    console.log(colors.green(`Step 2 - Extracted drawdownToken: ${drawdownToken}`));

    // Check if drawdownToken was successfully extracted
    if (!drawdownToken) {
      console.log(colors.red('Error: Failed to extract drawdownToken from previous response'));
      console.log(colors.red(`Response was: ${JSON.stringify(response1.data)}`));
      process.exit(1);
    }

    console.log(colors.yellow(`Calling POST ${ktbConfig.base_url}/dcb/lending/v1/drawdown/submit-to-saving`));

    const requestId2 = generateRequestId();
    console.log(colors.yellow(`Using request ID: ${requestId2}`));

    // Prepare request body
    const requestBody2 = {
      drawdownToken: drawdownToken,
      channelTxnRefId: channelTxnRefId,
      selectedPlanId: ktbConfig.selected_plan_id
    };

    // Log request body
    console.log(colors.yellow('Step 2 - Request Body:'));
    console.log(JSON.stringify(requestBody2, null, 2));

    // Log headers
    console.log(colors.yellow('Step 2 - Request Headers:'));
    const headers2 = {
      'x-request-id': requestId2,
      'x-channel-id': ktbConfig.headers.drawdown['x-channel-id'],
      'x-traceparent': traceParentUuid,
      'x-devops-src': ktbConfig.headers.drawdown['x-devops-src'],
      'x-devops-dest': ktbConfig.headers.drawdown['x-devops-dest'],
      'x-devops-key': ktbConfig.headers.drawdown['x-devops-key'],
      'Content-Type': 'application/json'
    };
    console.log(JSON.stringify(headers2, null, 2));

    // Make API request
    console.log(colors.yellow('Step 2 - Sending request...'));
    const response2 = await makeApiRequest(
      'post',
      `${ktbConfig.base_url}/dcb/lending/v1/drawdown/submit-to-saving`,
      headers2,
      requestBody2
    );

    // Log response
    console.log(colors.green('Step 2 - Response received:'));
    console.log(JSON.stringify(response2.data, null, 2));

    // Step 3: Confirm to Saving
    console.log(colors.green('===== Step 3: Confirm to Saving ====='));
    console.log(colors.yellow(`Calling POST ${ktbConfig.base_url}/dcb/lending/v1/drawdown/confirm-to-saving`));
    console.log(colors.yellow(`Step 3 - Using drawdownToken from previous steps: ${drawdownToken}`));

    const requestId3 = generateRequestId();
    console.log(colors.yellow(`Step 3 - Generated request ID: ${requestId3}`));
    console.log(colors.yellow(`Step 3 - Using trace parent UUID: ${traceParentUuid}`));

    // Prepare request body
    const requestBody3 = {
      drawdownToken: drawdownToken,
      note: "DISBURSEMENT"
    };

    // Log request body
    console.log(colors.yellow('Step 3 - Request Body:'));
    console.log(JSON.stringify(requestBody3, null, 2));

    // Log headers
    console.log(colors.yellow('Step 3 - Request Headers:'));
    const headers3 = {
      'x-request-id': requestId3,
      'x-channel-id': ktbConfig.headers.drawdown['x-channel-id'],
      'x-traceparent': traceParentUuid,
      'x-devops-src': ktbConfig.headers.drawdown['x-devops-src'],
      'x-devops-dest': ktbConfig.headers.drawdown['x-devops-dest'],
      'x-devops-key': ktbConfig.headers.drawdown['x-devops-key'],
      'Content-Type': 'application/json'
    };
    console.log(JSON.stringify(headers3, null, 2));

    // Make API request
    console.log(colors.yellow('Step 3 - Sending request...'));
    const response3 = await makeApiRequest(
      'post',
      `${ktbConfig.base_url}/dcb/lending/v1/drawdown/confirm-to-saving`,
      headers3,
      requestBody3
    );

    // Log response
    console.log(colors.green('Step 3 - Response received:'));
    console.log(JSON.stringify(response3.data, null, 2));

    // Step 4: Get Amortization Table
    console.log(colors.green('===== Step 4: Get Amortization Table ====='));
    console.log(colors.yellow(`Calling POST ${ktbConfig.base_url}/dcb/lending/v1/drawdown/amortization-table`));

    const requestId4 = generateRequestId();
    console.log(colors.yellow(`Step 4 - Generated request ID: ${requestId4}`));
    console.log(colors.yellow(`Step 4 - Using trace parent UUID: ${traceParentUuid}`));

    // Log request body
    console.log(colors.yellow('Step 4 - Request Body:'));
    console.log(JSON.stringify(requestBody4, null, 2));
    console.log(colors.yellow(`Step 4 - Using account number: ${requestBody4.accountNumber}`));
    console.log(colors.yellow(`Step 4 - Using drawdown amount: ${requestBody4.drawdownAmount}`));
    console.log(colors.yellow(`Step 4 - Using tenor: ${requestBody4.tenor}`));

    // Log headers
    console.log(colors.yellow('Step 4 - Request Headers:'));
    const headers4 = {
      'x-request-id': requestId4,
      'x-channel-id': ktbConfig.headers.drawdown['x-channel-id'],
      'x-traceparent': traceParentUuid,
      'x-devops-src': ktbConfig.headers.drawdown['x-devops-src'],
      'x-devops-dest': ktbConfig.headers.drawdown['x-devops-dest'],
      'x-devops-key': ktbConfig.headers.drawdown['x-devops-key'],
      'Content-Type': 'application/json'
    };
    console.log(JSON.stringify(headers4, null, 2));

    // Make API request
    console.log(colors.yellow('Step 4 - Sending request...'));
    const response4 = await makeApiRequest(
      'post',
      `${ktbConfig.base_url}/dcb/lending/v1/drawdown/amortization-table`,
      headers4,
      requestBody4
    );

    // Log response
    console.log(colors.green('Step 4 - Response received:'));
    console.log(JSON.stringify(response4.data, null, 2));

    // Print flow completion message
    console.log(colors.green('===== Flow Completed ====='));
    console.log(colors.green(`Drawdown process completed successfully at ${new Date().toISOString()}`));

    // Print summary of the flow execution
    console.log(colors.green('===== Flow Execution Summary ====='));
    console.log(colors.yellow(`LOC Account Number: ${ktbConfig.loc_account_no}`));
    console.log(colors.yellow(`Disbursement Amount: ${ktbConfig.disburse_amount}`));
    console.log(colors.yellow(`To Account Number: ${ktbConfig.to_account_no}`));
    console.log(colors.yellow(`Product Market Code: ${ktbConfig.product_market_code}`));
    console.log(colors.yellow(`Drawdown Token: ${drawdownToken}`));
    console.log(colors.yellow(`Selected Plan ID: ${ktbConfig.selected_plan_id}`));
    console.log(colors.yellow(`Tenor: ${requestBody4.tenor}`));

    // Log all request IDs used in the process
    console.log(colors.yellow('Request IDs used:'));
    console.log(colors.yellow(`- Step 1 (Drawdown Installmentation): ${requestId1}`));
    console.log(colors.yellow(`- Step 2 (Submit Plan Selection): ${requestId2}`));
    console.log(colors.yellow(`- Step 3 (Confirm to Saving): ${requestId3}`));
    console.log(colors.yellow(`- Step 4 (Get Amortization Table): ${requestId4}`));

    console.log(colors.green('===== End of Summary ====='));

    // Disable file logging
    const finalLogPath = getLogFilePath();
    disableFileLogging();
    console.log(colors.green(`File logging disabled. Log file: ${finalLogPath}`));

  } catch (error) {
    console.log(colors.red('===== ERROR OCCURRED ====='));
    console.log(colors.red(`Error at ${new Date().toISOString()}`));
    console.log(colors.red(`Error message: ${error.message}`));

    // Log more details about the error if available
    if (error.response) {
      console.log(colors.red('API Response Error:'));
      console.log(colors.red(`Status: ${error.response.status}`));
      console.log(colors.red(`Status Text: ${error.response.statusText}`));
      console.log(colors.red('Response Headers:'));
      console.log(JSON.stringify(error.response.headers, null, 2));
      console.log(colors.red('Response Data:'));
      console.log(JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log(colors.red('No response received from API'));
      console.log(colors.red('Request details:'));
      console.log(JSON.stringify(error.request, null, 2));
    }

    console.log(colors.red('Error stack trace:'));
    console.log(colors.red(error.stack));
    console.log(colors.red('===== END OF ERROR ====='));

    // Disable file logging even in case of error
    const errorLogPath = getLogFilePath();
    disableFileLogging();
    console.log(colors.red(`File logging disabled. Error details saved to: ${errorLogPath}`));

    process.exit(1);
  }
}

// Execute the main function if this script is run directly
if (require.main === module) {
  ktbDrawdown();
}

// Export the function for use in other scripts
module.exports = { ktbDrawdown };
