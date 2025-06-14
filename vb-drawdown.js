/**
 * Flow Script for DCB Lending System - VB
 * This script demonstrates a typical lending flow by making API calls to various services
 *
 * Flow Overview:
 * 1. Drawdown Installmentation - Initiates a drawdown request with account and amount details
 * 2. Submit Plan Selection - Selects a repayment plan using the drawdown token from step 1
 * 3. Confirm to Saving/Biller - Confirms the drawdown to saving account or biller based on drawdown_type
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

    // Generate random UUIDs for headers
    const channelTxnRefId = generateRequestId();
    const traceParentUuid = generateTraceParentUuid();

    // Step 1: Drawdown Installmentation
    console.log(colors.green('===== Step 1: Drawdown Installmentation ====='));
    console.log(colors.yellow(`Calling POST https://intgw-dlp-sit.core-bank.tripperpix.com/dcb/lending/v1/drawdown/installmentation`));
    
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
      'https://intgw-dlp-sit.core-bank.tripperpix.com/dcb/lending/v1/drawdown/installmentation',
      {
        'x-devops-src': 'bib',
        'x-devops-dest': 'vb-dlp',
        'x-devops-key': 'tS19zj2II4CKO0w13UnVGavXQp0KO83u',
        'x-channel-id': 'bib',
        'x-request-id': 'd9881229-79d0-40dc-94bb-2afc5b81eb7f',
        'x-traceparent': '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
        'Content-Type': 'application/json'
      },
      requestBody1
    );

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

    console.log(colors.yellow(`Calling POST https://intgw-dlp-sit.core-bank.tripperpix.com/dcb/lending/v1/drawdown/submit-to-saving`));
    
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
      'https://intgw-dlp-sit.core-bank.tripperpix.com/dcb/lending/v1/drawdown/submit-to-saving',
      {
        'x-devops-src': 'bib',
        'x-devops-dest': 'vb-dlp',
        'x-devops-key': 'tS19zj2II4CKO0w13UnVGavXQp0KO83u',
        'x-channel-id': 'bib',
        'x-request-id': requestId2,
        'x-traceparent': traceParentUuid,
        'Content-Type': 'application/json'
      },
      requestBody2
    );

    // Step 3: Confirm Drawdown (to Saving or Biller based on drawdown_type)
    const drawdownType = vbConfig.drawdown_type;
    
    if (drawdownType === 'Saving') {
      console.log(colors.green('===== Step 3: Confirm to Saving ====='));
      console.log(colors.yellow(`Calling POST https://intgw-dlp-sit.core-bank.tripperpix.com/dcb/lending/v1/drawdown/confirm-to-saving`));
      
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
        'https://intgw-dlp-sit.core-bank.tripperpix.com/dcb/lending/v1/drawdown/confirm-to-saving',
        {
          'x-devops-src': 'bib',
          'x-devops-dest': 'vb-dlp',
          'x-devops-key': 'tS19zj2II4CKO0w13UnVGavXQp0KO83u',
          'x-channel-id': 'VB',
          'x-request-id': requestId3,
          'x-traceparent': traceParentUuid,
          'Content-Type': 'application/json'
        },
        requestBody3
      );
    } else if (drawdownType === 'bill') {
      console.log(colors.green('===== Step 3: Confirm to Biller ====='));
      console.log(colors.yellow(`Calling POST https://intgw-dlp-sit.core-bank.tripperpix.com/dcb/lending/v1/drawdown/confirm-to-biller`));
      
      const requestId3 = generateRequestId();
      console.log(colors.yellow(`Using request ID: ${requestId3}`));

      // Prepare request body
      const requestBody3 = {
        drawdownToken: drawdownToken
      };

      // Add delay and log request body
      await delayAndLog("Step 3: Confirm to Biller", requestBody3);

      // Make API request
      const response3 = await makeApiRequest(
        'post',
        'https://intgw-dlp-sit.core-bank.tripperpix.com/dcb/lending/v1/drawdown/confirm-to-biller',
        {
          'x-devops-src': 'bib',
          'x-devops-dest': 'vb-dlp',
          'x-devops-key': 'tS19zj2II4CKO0w13UnVGavXQp0KO83u',
          'x-channel-id': 'VB',
          'x-request-id': requestId3,
          'x-traceparent': traceParentUuid,
          'Content-Type': 'application/json'
        },
        requestBody3
      );
    } else {
      console.log(colors.red(`Error: Invalid DRAWDOWN_TYPE value: ${drawdownType}. Must be 'Saving' or 'bill'.`));
      process.exit(1);
    }

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