/**
 * Flow Script for DCB Lending System - VB
 * This script demonstrates a typical lending flow by making API calls to various services
 *
 * Flow Overview:
 * 1. Drawdown Installmentation - Initiates a drawdown request with account and amount details
 * 2. Submit Plan Selection - Selects a repayment plan using the drawdown token from step 1
 * 3. Confirm to Saving/Biller - Confirms the drawdown to saving account or biller based on drawdown_type
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
 * Main function to execute the VB drawdown flow
 */
async function vbDrawdown() {
  try {
    // Load configuration
    const config = await loadConfig();
    const vbConfig = config.vb;

    // Define request body for step 4
    const requestBody4 = {
      accountNumber: vbConfig.loc_account_no,
      drawdownAmount: parseFloat(vbConfig.disburse_amount).toString(),
      tenor: 0,
    };

    // Generate random UUIDs for headers
    const channelTxnRefId = generateRequestId();
    const traceParentUuid = generateTraceParentUuid();

    // Step 1: Drawdown Installmentation
    console.log(colors.green('===== Step 1: Drawdown Installmentation ====='));
    console.log(colors.yellow(`Calling POST ${vbConfig.base_url}/dcb/lending/v1/drawdown/installmentation`));

    const requestId1 = generateRequestId();
    console.log(colors.yellow(`Using request ID: ${requestId1}`));

    // Prepare request body
    const requestBody1 = {
      locAccountNo: vbConfig.loc_account_no,
      toAccountNo: vbConfig.to_account_no,
      productMarketCode: vbConfig.product_market_code,
      disburseAmount: parseFloat(vbConfig.disburse_amount),
      currency: "THB",
      ccdId: vbConfig.ccd_id
    };


    // Make API request
    const response1 = await makeApiRequest(
      'post',
      `${vbConfig.base_url}/dcb/lending/v1/drawdown/installmentation`,
      {
        'x-devops-src': vbConfig.headers.drawdown['x-devops-src'],
        'x-devops-dest': vbConfig.headers.drawdown['x-devops-dest'],
        'x-devops-key': vbConfig.headers.drawdown['x-devops-key'],
        'x-channel-id': vbConfig.headers.drawdown['x-channel-id'],
        'x-request-id': requestId1,
        'x-traceparent': traceParentUuid,
        'Content-Type': 'application/json'
      },
      requestBody1
    );

    console.log(JSON.stringify(requestBody1, null, 2));

    // Step 2: Submit Plan Selection
    console.log(colors.green('===== Step 2: Submit Plan Selection ====='));

    // Extract drawdownToken from step 1 response
    const drawdownToken = await checkResponse(response1, 'data.drawdownToken', '', 'DRAWDOWN_TOKEN');
    console.log(colors.yellow(`Extracted drawdownToken: ${drawdownToken}`));

    // Check if drawdownToken was successfully extracted
    if (!drawdownToken) {
      console.log(colors.red('Error: Failed to extract drawdownToken from previous response'));
      console.log(colors.red(`Response was: ${JSON.stringify(response1.data)}`));
      process.exit(1);
    }

      const resp1Data =  response1.data.data.installmentPlan[parseInt(vbConfig.selected_plan_id)];
      requestBody4.tenor = resp1Data.tenor.toString();



      console.log(colors.yellow(`Calling POST ${vbConfig.base_url}/dcb/lending/v1/drawdown/submit-to-saving`));

    const requestId2 = generateRequestId();
    console.log(colors.yellow(`Using request ID: ${requestId2}`));

    // Prepare request body
    const requestBody2 = {
      channelTxnRefId: channelTxnRefId,
      drawdownToken: drawdownToken,
      selectedPlanId: vbConfig.selected_plan_id
    };


    // Make API request
    const response2 = await makeApiRequest(
      'post',
      `${vbConfig.base_url}/dcb/lending/v1/drawdown/submit-to-saving`,
      {
        'x-devops-src': vbConfig.headers.drawdown['x-devops-src'],
        'x-devops-dest': vbConfig.headers.drawdown['x-devops-dest'],
        'x-devops-key': vbConfig.headers.drawdown['x-devops-key'],
        'x-channel-id': vbConfig.headers.drawdown['x-channel-id'],
        'x-request-id': requestId2,
        'x-traceparent': traceParentUuid,
        'Content-Type': 'application/json'
      },
      requestBody2
    );

    console.log(JSON.stringify(requestBody2, null, 2));

    // Step 3: Confirm Drawdown (to Saving or Biller based on drawdown_type)
    const drawdownType = vbConfig.drawdown_type;

    if (drawdownType === 'Saving') {
      console.log(colors.green('===== Step 3: Confirm to Saving ====='));
      console.log(colors.yellow(`Calling POST ${vbConfig.base_url}/dcb/lending/v1/drawdown/confirm-to-saving`));

      const requestId3 = generateRequestId();
      console.log(colors.yellow(`Using request ID: ${requestId3}`));

      // Prepare request body
      const requestBody3 = {
        drawdownToken: drawdownToken,
        note: "test VB drawdown"
      };


      // Make API request
      const response3 = await makeApiRequest(
        'post',
        `${vbConfig.base_url}/dcb/lending/v1/drawdown/confirm-to-saving`,
        {
          'x-devops-src': vbConfig.headers.drawdown['x-devops-src'],
          'x-devops-dest': vbConfig.headers.drawdown['x-devops-dest'],
          'x-devops-key': vbConfig.headers.drawdown['x-devops-key'],
          'x-channel-id': vbConfig.headers.drawdown['x-channel-id'],
          'x-request-id': requestId3,
          'x-traceparent': traceParentUuid,
          'Content-Type': 'application/json'
        },
        requestBody3
      );

      console.log(JSON.stringify(requestBody3, null, 2));
    } else if (drawdownType === 'bill') {
      console.log(colors.green('===== Step 3: Confirm to Biller ====='));
      console.log(colors.yellow(`Calling POST ${vbConfig.base_url}/dcb/lending/v1/drawdown/confirm-to-biller`));

      const requestId3 = generateRequestId();
      console.log(colors.yellow(`Using request ID: ${requestId3}`));

      // Prepare request body
      const requestBody3 = {
        drawdownToken: drawdownToken
      };

      // Log request body
      console.log(colors.yellow("Step 3: Confirm to Biller"));

      // Make API request
      const response3 = await makeApiRequest(
        'post',
        `${vbConfig.base_url}/dcb/lending/v1/drawdown/confirm-to-biller`,
        {
          'x-devops-src': vbConfig.headers.drawdown['x-devops-src'],
          'x-devops-dest': vbConfig.headers.drawdown['x-devops-dest'],
          'x-devops-key': vbConfig.headers.drawdown['x-devops-key'],
          'x-channel-id': vbConfig.headers.drawdown['x-channel-id'],
          'x-request-id': requestId3,
          'x-traceparent': traceParentUuid,
          'Content-Type': 'application/json'
        },
        requestBody3
      );

      console.log(JSON.stringify(requestBody3, null, 2));
    } else {
      console.log(colors.red(`Error: Invalid DRAWDOWN_TYPE value: ${drawdownType}. Must be 'Saving' or 'bill'.`));
      process.exit(1);
    }

    // Step 4: Get Amortization Table
    console.log(colors.green('===== Step 4: Get Amortization Table ====='));
    console.log('');
    console.log(colors.yellow(`Calling POST ${vbConfig.base_url}/dcb/lending/v1/drawdown/amortization-table`));

    const requestId4 = generateRequestId();
    console.log(colors.yellow(`Using request ID: ${requestId4}`));

    // Make API request
    const response4 = await makeApiRequest(
      'post',
      `${vbConfig.base_url}/dcb/lending/v1/drawdown/amortization-table`,
      {
        'x-request-id': requestId4,
        'x-channel-id': vbConfig.headers.drawdown['x-channel-id'],
        'x-traceparent': traceParentUuid,
        'x-devops-src': vbConfig.headers.drawdown['x-devops-src'],
        'x-devops-dest': vbConfig.headers.drawdown['x-devops-dest'],
        'x-devops-key': vbConfig.headers.drawdown['x-devops-key'],
        'Content-Type': 'application/json'
      },
      requestBody4
    );

    console.log(JSON.stringify(requestBody4, null, 2));


    // Print flow completion message
    console.log(colors.green('===== Flow Completed ====='));

    // Print summary of the flow execution
    console.log(colors.green('===== Flow Execution Summary ====='));
    console.log(colors.yellow(`LOC Account Number: ${vbConfig.loc_account_no}`));
    console.log(colors.yellow(`Disbursement Amount: ${vbConfig.disburse_amount}`));
    console.log(colors.yellow(`To Account Number: ${vbConfig.to_account_no}`));
    console.log(colors.yellow(`Product Market Code: ${vbConfig.product_market_code}`));
    console.log(colors.yellow(`Drawdown Token: ${drawdownToken}`));
    console.log(colors.green('===== End of Summary ====='));

  } catch (error) {
    console.log(colors.red(`Unhandled error: ${error.message}`));
    process.exit(1);
  }
}

// Execute the main function if this script is run directly
if (require.main === module) {
  vbDrawdown();
}

// Export the function for use in other scripts
module.exports = { vbDrawdown };
