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
  loadConfig
} = require('./utils');


/**
 * Main function to execute the KTB drawdown flow
 */
async function ktbDrawdown() {
  try {
    // Load configuration
    const config = await loadConfig();
    const ktbConfig = config.ktb;

    // Define request body for step 4
    const requestBody4 = {
      accountNumber: ktbConfig.loc_account_no,
      drawdownAmount: parseFloat(ktbConfig.disburse_amount),
      tenor: 0,
    };

    // Generate random UUIDs for headers
    const channelTxnRefId = generateRequestId();
    const traceParentUuid = generateTraceParentUuid();

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

    // Add delay and log request body

    // Make API request
    const response1 = await makeApiRequest(
      'post',
      `${ktbConfig.base_url}/dcb/lending/v1/drawdown/installmentation`,
      {
        'x-request-id': requestId1,
        'x-channel-id': 'PT',
        'x-traceparent': traceParentUuid,
        'x-devops-src': 'bib',
        'x-devops-dest': 'ktb-dlp',
        'x-devops-key': 'RbRrmnA2HKy0O1medxxd04Zyd52BVLht',
        'Content-Type': 'application/json'
      },
      requestBody1
    );

      console.log(JSON.stringify(response1.data, null, 2))

    // Step 2: Submit Plan Selection
    console.log(colors.green('===== Step 2: Submit Plan Selection ====='));

    // Extract drawdownToken from step 1 response
    const drawdownToken = await checkResponse(response1, 'data.drawdownToken', '', 'DRAWDOWN_TOKEN');

    const resp1Data =  response1.data.data.installmentPlan[parseInt(ktbConfig.selected_plan_id)];
    requestBody4.tenor = resp1Data.tenor;
    requestBody4.tenor = resp1Data.tenor.toString();

    console.log(colors.yellow(`Extracted drawdownToken: ${drawdownToken}`));

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


    // Make API request
    const response2 = await makeApiRequest(
      'post',
      `${ktbConfig.base_url}/dcb/lending/v1/drawdown/submit-to-saving`,
      {
        'x-request-id': requestId2,
        'x-channel-id': 'PT',
        'x-traceparent': traceParentUuid,
        'x-devops-src': 'bib',
        'x-devops-dest': 'ktb-dlp',
        'x-devops-key': 'RbRrmnA2HKy0O1medxxd04Zyd52BVLht',
        'Content-Type': 'application/json'
      },
      requestBody2
    );

      console.log(JSON.stringify(requestBody2, null, 2))

    // Step 3: Confirm to Saving
    console.log(colors.green('===== Step 3: Confirm to Saving ====='));
    console.log('');
    console.log(colors.yellow(`Calling POST ${ktbConfig.base_url}/dcb/lending/v1/drawdown/confirm-to-saving`));
    console.log(colors.yellow(`Extracted drawdownToken: ${drawdownToken}`));

    const requestId3 = generateRequestId();
    console.log(colors.yellow(`Using request ID: ${requestId3}`));
    console.log(colors.yellow(`TRACE_PARENT_UUID: ${traceParentUuid}`));

    // Prepare request body
    const requestBody3 = {
      drawdownToken: drawdownToken,
      note: "DISBURSEMENT"
    };


    // Make API request
    const response3 = await makeApiRequest(
      'post',
      `${ktbConfig.base_url}/dcb/lending/v1/drawdown/confirm-to-saving`,
      {
        'x-request-id': requestId3,
        'x-channel-id': 'PT',
        'x-traceparent': traceParentUuid,
        'x-devops-src': 'bib',
        'x-devops-dest': 'ktb-dlp',
        'x-devops-key': 'RbRrmnA2HKy0O1medxxd04Zyd52BVLht',
        'Content-Type': 'application/json'
      },
      requestBody3
    );

      console.log(JSON.stringify(requestBody3, null, 2))

    // Step 4: Get Amortization Table
    console.log(colors.green('===== Step 4: Get Amortization Table ====='));
    console.log('');
    console.log(colors.yellow(`Calling POST https://intgw-dlp-sit.ktb-core-bank.nonprod.aws.ktbcloud/dcb/lending/v1/drawdown/amortization-table`));

    const requestId4 = generateRequestId();
    console.log(colors.yellow(`Using request ID: ${requestId4}`));

    // Make API request
    const response4 = await makeApiRequest(
      'post',
      `https://intgw-dlp-sit.ktb-core-bank.nonprod.aws.ktbcloud/dcb/lending/v1/drawdown/amortization-table`,
      {
        'x-request-id': requestId4,
        'x-channel-id': 'PT',
        'x-traceparent': traceParentUuid,
        'x-devops-src': 'bib',
        'x-devops-dest': 'ktb-dlp',
        'x-devops-key': 'RbRrmnA2HKy0O1medxxd04Zyd52BVLht',
        'Content-Type': 'application/json'
      },
      requestBody4
    );

    console.log(JSON.stringify(requestBody4, null, 2))

    // Print flow completion message
    console.log(colors.green('===== Flow Completed ====='));

    // Print summary of the flow execution
    console.log(colors.green('===== Flow Execution Summary ====='));
    console.log(colors.yellow(`LOC Account Number: ${ktbConfig.loc_account_no}`));
    console.log(colors.yellow(`Disbursement Amount: ${ktbConfig.disburse_amount}`));
    console.log(colors.yellow(`To Account Number: ${ktbConfig.to_account_no}`));
    console.log(colors.yellow(`Product Market Code: ${ktbConfig.product_market_code}`));
    console.log(colors.yellow(`Drawdown Token: ${drawdownToken}`));
    console.log(colors.green('===== End of Summary ====='));

  } catch (error) {
    console.log(colors.red(`Unhandled error: ${error.message}`));
    process.exit(1);
  }
}

// Execute the main function if this script is run directly
if (require.main === module) {
  ktbDrawdown();
}

// Export the function for use in other scripts
module.exports = { ktbDrawdown };
