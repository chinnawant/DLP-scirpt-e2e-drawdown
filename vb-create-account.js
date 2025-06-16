/**
 * Script for DCB Lending System - VB Account Creation
 * This script creates a new account in the VB system by making an API call
 * to the account creation endpoint.
 */

const {
  colors,
  generateRequestId,
  generateTraceParentUuid,
  checkResponse,
  makeApiRequest,
  loadConfig,
  updateConfig
} = require('./utils');

/**
 * Main function to execute the VB account creation
 */
async function vbCreateAccount() {
  try {
    // Load configuration
    const config = await loadConfig();
    const vbConfig = config.vb;

    // Generate random UUIDs for headers
    const requestId = generateRequestId();
    const traceParentUuid = generateTraceParentUuid();

    console.log(colors.green('===== VB Account Creation ====='));
    console.log(colors.yellow(`Calling POST https://intgw-dlp-sit.core-bank.tripperpix.com/dcb/lending/v1/accounts/loc/create`));
    console.log(colors.yellow(`Using request ID: ${requestId}`));

    // Use hardcoded contractRefId from the curl command
    const contractRefId = generateRequestId();
    console.log(colors.yellow(`Using contractRefId: ${contractRefId}`));

    // Prepare request body
    const requestBody = {
      contractRefId: contractRefId,
      contractAcceptanceDate: "2025-06-04",
      productId: "21cff67c-b6c3-417e-a66f-e1d33341040f",
      transactionDateTime: "2025-06-04T00:00:01+07:00",
      openChannelId: "VB",
      ccdId: vbConfig.ccd_id,
      accountNameTH: "นส. ทดสอบ บัญชี",
      accountNameEN: "Sample Account",
      productMarketCode: vbConfig.product_market_code || "1207",
      currencyCode: "THB",
      approveCreditLimit: 20000.00,
      cashDisbursementPercentage: 1,
      dueDay: "5",
      appInDate: "2025-06-04",
      interestRate: 20,
      payoutAccountNo: "0700000098",
      repaymentAccountNo: "0700000098",
      payoutAccountSource: "DCB",
      repaymentAccountSource: "DCB",
      costCenter: "CC001",
      branchCode: 1,
      responseUnit: "1",
      mailingAddress: {
        addressLine1: "Sample Address",
        addressLine2: "Address",
        addressLine3: "Address",
        subDistrict: "Dindaeng",
        district: "Dindaeng",
        province: "Bangkok",
        postalCode: "10400",
        country: "Thailand"
      },
      residentialContact: {
        mobilePhone: "0999999999",
        email: "test@test.com"
      },
      maxAge: 50,
      maxAgeDate: "2075-12-31",
      occupationType: "SA"
    };

    // Make API request
    const response = await makeApiRequest(
      'post',
      'https://intgw-dlp-sit.core-bank.tripperpix.com/dcb/lending/v1/accounts/loc/create',
      {
        'x-request-id': requestId,
        'x-channel-id': 'DGL',
        'x-traceparent': traceParentUuid,
        'x-devops-src': 'dgl',
        'x-devops-dest': 'vb-dlp',
        'x-devops-key': 'saqWi8phhO5w0LiYA03eqIY0aju6x9rI',
        'Content-Type': 'application/json'
      },
      requestBody
    );

    // Extract account number and contractRefId from response
    const accountNumber = await checkResponse(response, 'data.accountNumber', '', 'ACCOUNT_NUMBER');
    const responseContractRefId = await checkResponse(response, 'data.contractRefId', requestBody.contractRefId, 'CONTRACT_REF_ID');

    // Save contractRefId to config.json
    if (responseContractRefId) {
      await updateConfig('vb', 'contract_ref_id', responseContractRefId);
    }


    if (accountNumber) {
      await updateConfig('vb', 'loc_account_no', accountNumber);
    }


    // Note: We're no longer saving accountNumber to config.json
    // Instead, we're using the existing value from vb.loc_account_no

    // Print summary of the account creation
    console.log(colors.green('===== Account Creation Summary ====='));
    console.log(colors.yellow(`Contract Reference ID: ${responseContractRefId || requestBody.contractRefId}`));
    console.log(colors.yellow(`Product Market Code: ${requestBody.productMarketCode}`));
    console.log(colors.yellow(`Account Name: ${requestBody.accountNameEN}`));
    console.log(colors.yellow(`Account Number: ${accountNumber}`));
    console.log(colors.green('===== End of Summary ====='));

  } catch (error) {
    console.log(colors.red(`Unhandled error: ${error.message}`));
    process.exit(1);
  }
}

// Execute the main function if this script is run directly
if (require.main === module) {
  vbCreateAccount();
}

// Export the function for use in other scripts
module.exports = { vbCreateAccount };
