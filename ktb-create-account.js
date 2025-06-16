/**
 * Script for DCB Lending System - KTB Account Creation
 * This script creates a new account in the KTB system by making an API call
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
 * Main function to execute the KTB account creation
 */
async function ktbCreateAccount() {
  try {
    // Load configuration
    const config = await loadConfig();
    const ktbConfig = config.ktb;

    // Generate random UUIDs for headers
    const requestId = generateRequestId();
    const traceParentUuid = generateTraceParentUuid();

    console.log(colors.green('===== KTB Account Creation ====='));
    console.log(colors.yellow(`Calling POST ${ktbConfig.base_url}/dcb/lending/v1/accounts/loc/create`));
    console.log(colors.yellow(`Using request ID: ${requestId}`));

    // Generate UUID for contractRefId
    const contractRefId = generateRequestId();
    console.log(colors.yellow(`Generated contractRefId: ${contractRefId}`));

    // Prepare request body
    const requestBody = {
      contractRefId: contractRefId,
      contractAcceptanceDate: "2025-03-25",
      productId: "63b692ea-56b4-4b7d-8402-478d74a457fd",
      transactionDateTime: "2025-01-31T23:59:01+07:00",
      openChannelId: "NEXT",
      cifNo: "31379829",
      cdiToken: "uQmLtyjEltxu9P1",
      accountNameTH: "นส. ทดสอบ บัญชี",
      accountNameEN: "Sample Account",
      productMarketCode: ktbConfig.product_market_code || "1207",
      currencyCode: "THB",
      approveCreditLimit: 100000,
      cashDisbursementPercentage: 1,
      dueDay: "15",
      appInDate: "2025-03-24",
      interestRate: 5.75,
      payoutAccountNo: "1640000240",
      repaymentAccountNo: "1640000231",
      payoutAccountSource: "CBS",
      repaymentAccountSource: "CBS",
      costCenter: "CC001",
      branchCode: 0,
      responseUnit: "1",
      mailingAddress: {
        addressLine1: "Sample Address",
        addressLine2: "",
        addressLine3: "",
        subDistrict: "11001",
        district: "112",
        province: "11",
        postalCode: "10400",
        country: "11"
      },
      residentialContact: {
        mobilePhone: "0999999999",
        email: "test@test.com"
      },
      maxAge: 60,
      maxAgeDate: "2045-05-05",
      occupationType: "SA",
      contractNumber: "00001",
      estampPaymentTxnRef: "00001",
      loanSignedDate: "2025-03-25",
      arranPurposeCd: "012001",
      perConsumpCd: "241021",
      approveCode: "001",
      approveId1: "",
      approveId2: "",
      approveId3: "",
      userId: "KTB"
    };

    // Make API request
    const response = await makeApiRequest(
      'post',
      `${ktbConfig.base_url}/dcb/lending/v1/accounts/loc/create`,
      {
        'x-request-id': requestId,
        'x-channel-id': 'DGL',
        'x-traceparent': traceParentUuid,
        'x-devops-src': 'dgl',
        'x-devops-dest': 'ktb-dlp',
        'x-devops-key': 'u6CDy4QpU4nz4u2Y7PMbVTxJfZKzP7JM',
        'Content-Type': 'application/json'
      },
      requestBody
    );

    // Extract account number and contractRefId from response
    const accountNumber = await checkResponse(response, 'data.accountNo', '', 'ACCOUNT_NUMBER');
    const responseContractRefId = await checkResponse(response, 'data.contractRefId', requestBody.contractRefId, 'CONTRACT_REF_ID');

    // Save contractRefId to config.json
    if (responseContractRefId) {
      await updateConfig('ktb', 'contract_ref_id', responseContractRefId);
    }

    // Note: We're no longer saving accountNumber to config.json
    // Instead, we're using the existing value from ktb.loc_account_no

    // Print summary of the account creation
    console.log(colors.green('===== Account Creation Summary ====='));
    console.log(colors.yellow(`Contract Reference ID: ${responseContractRefId || requestBody.contractRefId}`));
    console.log(colors.yellow(`Product Market Code: ${requestBody.productMarketCode}`));
    console.log(colors.yellow(`Account Name: ${requestBody.accountNameEN}`));
    console.log(colors.yellow(`Account Number: ${ktbConfig.loc_account_no}`));
    console.log(colors.green('===== End of Summary ====='));

  } catch (error) {
    console.log(colors.red(`Unhandled error: ${error.message}`));
    process.exit(1);
  }
}

// Execute the main function if this script is run directly
if (require.main === module) {
  ktbCreateAccount();
}

// Export the function for use in other scripts
module.exports = { ktbCreateAccount };
