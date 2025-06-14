# DCB Lending System API Scripts

This repository contains scripts for interacting with the DCB Lending System API. These scripts demonstrate a typical lending flow by making API calls to various services.

## Overview

The repository includes the following main scripts:

1. **ktb-drawdown.js** - Demonstrates a complete KTB lending flow with the following steps:
   - Drawdown Installmentation - Initiates a drawdown request with account and amount details
   - Submit Plan Selection - Selects a repayment plan using the drawdown token
   - Confirm to Saving - Confirms the drawdown to saving account

2. **vb-drawdown.js** - Demonstrates a complete VB lending flow similar to the KTB flow.

3. **ktb-create-account.js** - Creates a new LOC account in the KTB system by making an API call to the account creation endpoint.

4. **vb-create-account.js** - Creates a new LOC account in the VB system by making an API call to the account creation endpoint.

5. **ktb-delete-account.js** - Deletes KTB account records from databases:
   - orch_loan_account_creation database - loan_account table in public schema
   - proc_loan_account database - loan_account table in public schema

6. **vb-delete-account.js** - Deletes VB account records from databases:
   - orch_loan_account_creation database - loan_account table in public schema
   - proc_loan_account database - loan_account table in public schema

7. **clear-error-log.js** - Manages error logs by archiving existing logs and creating new ones.

8. **validate-config.js** - Validates the config.json file to ensure it contains all required fields.

## Requirements

- Node.js (v12 or higher)
- npm (for installing dependencies)
- PostgreSQL client library (for ktb-delete-account.js)

## Installation

1. Clone this repository to your local machine:
   ```
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies:

   **Option 1: Manual installation**
   ```
   npm install
   ```

   This will install all the required Node.js dependencies defined in package.json:
   - axios - For making HTTP requests
   - chalk - For colored console output
   - fs-extra - For enhanced file system operations
   - uuid - For generating UUIDs

   You'll also need to manually install:
   - Node.js (v12 or higher)
   - npm
   - PostgreSQL client library (for ktb-delete-account.js)

   **Option 2: Using apt-get (Ubuntu/Debian)**
   ```
   make setup-apt
   ```

   This will install Node.js, npm, and PostgreSQL client using apt-get, and then install the required Node.js dependencies using npm. Note that this command requires sudo privileges.

## Configuration

The scripts use a JSON configuration file (`config.json`) to store API request variables. Before running the scripts, you may want to modify the values in this file:

```json
{
  "ktb": {
    "base_url": "https://intgw-dlp-sit.ktb-core-bank.nonprod.aws.ktbcloud",
    "loc_account_no": "300000003224",
    "disburse_amount": "5000.00",
    "to_account_no": "1640002707",
    "product_market_code": "2003",
    "selected_plan_id": "1"
  },
  "vb": {
    "base_url": "https://intgw-dlp-sit.ktb-core-bank.nonprod.aws.ktbcloud",
    "loc_account_no": "520000000914",
    "disburse_amount": "2000.00",
    "to_account_no": "070000009810001",
    "product_market_code": "0001",
    "selected_plan_id": "1",
    "ccd_id": "678167231572766",
    "drawdown_type": "Saving"
  }
}
```

The configuration file contains separate sections for each script:

- **ktb section**: Configuration for `ktb-drawdown.js`
- **vb section**: Configuration for `vb-drawdown.js`

Each section contains the following variables:

- `base_url`: The base URL for the API endpoints
- `loc_account_no`: The LOC account number
- `disburse_amount`: The amount to disburse
- `to_account_no`: The account number to disburse to
- `product_market_code`: The product market code
- `selected_plan_id`: The selected plan ID
- `ccd_id`: (VB only) The CCD ID
- `drawdown_type`: (VB only) The drawdown type ("Saving" or "bill")

## Usage

### Using the Makefile

The project includes a Makefile to simplify common operations. To see all available commands:

```
make help
```

#### Available Targets:
- `make ktb` - Run KTB drawdown script
- `make vb` - Run VB drawdown script
- `make all` - Run both KTB and VB drawdown scripts
- `make clear-logs` - Clear error logs
- `make setup` - Install dependencies
- `make setup-apt` - Install dependencies using apt-get (Ubuntu/Debian)
- `make validate` - Validate config.json file
- `make ktb-delete` - Delete KTB account data from databases
- `make vb-delete` - Delete VB account data from databases
- `make ktb-create` - Create a new KTB LOC account
- `make vb-create` - Create a new VB LOC account

### Running the Lending Flow

#### KTB Drawdown Script

To execute the KTB lending flow:

```
node ktb-drawdown.js
```

Or using the Makefile:

```
make ktb
```

Or using npm:

```
npm run ktb
```

#### VB Drawdown Script

To execute the VB lending flow:

```
node vb-drawdown.js
```

Or using the Makefile:

```
make vb
```

Or using npm:

```
npm run vb
```

The scripts will:
1. Initiate a drawdown request
2. Submit a plan selection
3. Confirm the drawdown to a saving account (or biller for VB when configured)
4. Display a summary of the execution

The scripts will automatically handle errors and log them to `error_log.txt`.

### Managing Error Logs

The `clear-error-log.js` script is automatically called when an error occurs in the scripts. However, you can also run it manually:

```
node clear-error-log.js
```

Or using the Makefile:

```
make clear-logs
```

Or using npm:

```
npm run clear-logs
```

The script will:
1. Archive the current error log with a timestamp
2. Create a new empty error log file
3. Store archived logs in the `error_logs_archive` directory

### Creating KTB Accounts

To create a new KTB LOC account:

```
node ktb-create-account.js
```

Or using the Makefile:

```
make ktb-create
```

Or using npm:

```
npm run ktb-create
```

This will:
1. Generate a random contractRefId
2. Make an API call to create a new LOC account in the KTB system
3. Update the config.json file with the new contractRefId and account number
4. Display a summary of the account creation

### Creating VB Accounts

To create a new VB LOC account:

```
node vb-create-account.js
```

Or using the Makefile:

```
make vb-create
```

Or using npm:

```
npm run vb-create
```

This will:
1. Generate a random contractRefId
2. Make an API call to create a new LOC account in the VB system
3. Update the config.json file with the new contractRefId and account number
4. Display a summary of the account creation

### Deleting KTB Account Data

To delete KTB account data from the databases:

```
node ktb-delete-account.js
```

Or using the Makefile:

```
make ktb-delete
```

Or using npm:

```
npm run ktb-delete
```

This will:
1. Delete the record with the specified contract_ref_id from the `public.loan_account` table in the `orch_loan_account_creation` database
2. Delete the record with the specified contract_ref_id from the `public.loan_account` table in the `proc_loan_account` database
3. Display a summary of the deletion operation

Note: This script requires the PostgreSQL client library to be installed and properly configured with access to the target databases.

### Deleting VB Account Data

To delete VB account data from the databases:

```
node vb-delete-account.js
```

Or using the Makefile:

```
make vb-delete
```

Or using npm:

```
npm run vb-delete
```

This will:
1. Delete the record with the specified contract_ref_id from the `public.loan_account` table in the `orch_loan_account_creation` database
2. Delete the record with the specified contract_ref_id from the `public.loan_account` table in the `proc_loan_account` database
3. Display a summary of the deletion operation

Note: This script requires the PostgreSQL client library to be installed and properly configured with access to the target databases.

## Error Handling

When an API call fails:
1. The error is logged to `error_log.txt`
2. The current log is archived with a timestamp
3. A new log file is created
4. The script execution is terminated with an error message

## Example Output

A successful execution of either script will display output similar to the following (example from ktb-drawdown.js):

```
===== Step 1: Drawdown Installmentation =====
Calling POST https://intgw-dlp-sit.ktb-core-bank.nonprod.aws.ktbcloud/dcb/lending/v1/drawdown/installmentation
Response:
{
  "code": "0000",
  "message": "success",
  "data": {
    "drawdownToken": "abc123xyz456"
  }
}

===== Step 2: Submit Plan Selection =====
Extracted drawdownToken: abc123xyz456
Calling POST https://intgw-dlp-sit.ktb-core-bank.nonprod.aws.ktbcloud/dcb/lending/v1/drawdown/plan/selection
Response:
{
  "code": "0000",
  "message": "success"
}

===== Step 3: Confirm to Saving =====
Calling POST https://intgw-dlp-sit.ktb-core-bank.nonprod.aws.ktbcloud/dcb/lending/v1/drawdown/confirm-to-saving
Response:
{
  "code": "0000",
  "message": "success"
}

===== KTB-Drawdown Completed =====

===== KTB-Drawdown Execution Summary =====
LOC Account Number: 300000000149
Disbursement Amount: 12000.00
To Account Number: 223344556677
Product Market Code: 11b292ea-56b4-4b7d-8402-478d74a457fd
Drawdown Token: abc123xyz456
===== End of Summary =====
```

## Node.js Implementation

The repository includes a Node.js implementation of the scripts, which provides several benefits:

### Structure

The Node.js implementation consists of the following files:

- **package.json** - Defines the project dependencies and npm scripts
- **utils.js** - Contains utility functions used by all scripts
- **ktb-drawdown.js** - Node.js version of the KTB drawdown script
- **vb-drawdown.js** - Node.js version of the VB drawdown script
- **ktb-create-account.js** - Node.js script to create a new KTB LOC account
- **vb-create-account.js** - Node.js script to create a new VB LOC account
- **ktb-delete-account.js** - Node.js script to delete KTB account records from databases
- **vb-delete-account.js** - Node.js script to delete VB account records from databases
- **clear-error-log.js** - Node.js version of the error log management script
- **validate-config.js** - Node.js script to validate the config.json file

### Benefits

The Node.js implementation offers several advantages:

1. **Cross-platform compatibility** - Works on Windows, macOS, and Linux without requiring a Bash shell
2. **Improved error handling** - Uses JavaScript's try/catch for more robust error handling
3. **Better maintainability** - Modular code structure with reusable utility functions
4. **Enhanced HTTP requests** - Uses axios for more reliable HTTP requests with better error handling
5. **Modern JavaScript features** - Uses async/await for cleaner asynchronous code
6. **Colored console output** - Uses chalk for consistent and visually appealing console output
7. **NPM integration** - Can be run using npm scripts for easier integration with other Node.js tools

### Usage

You can run the Node.js scripts directly using Node.js, through the Makefile, or using npm scripts. See the relevant sections above for specific commands.

## Troubleshooting

If you encounter issues:

1. Check the `error_log.txt` file for detailed error information
2. Verify your network connection to the API endpoints
3. Ensure all required dependencies are installed
   - Node.js, npm, and the npm dependencies
4. Check that the API credentials and parameters are correct
5. Verify that the config.json file is valid and contains all required fields
6. SSL Certificate Issues:
   - The application is configured to accept self-signed certificates for development/testing environments
   - If you encounter "Network error: self-signed certificate" issues, the application should handle this automatically
   - This setting is appropriate for non-production environments only and should be reviewed for production deployments

## License

[Include license information here]
