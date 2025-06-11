# DCB Lending System API Scripts

This repository contains scripts for interacting with the DCB Lending System API. These scripts demonstrate a typical lending flow by making API calls to various services.

## Overview

The repository includes two main scripts:

1. **ktb-drawdown.sh** - Demonstrates a complete lending flow with the following steps:
   - Drawdown Installmentation - Initiates a drawdown request with account and amount details
   - Submit Plan Selection - Selects a repayment plan using the drawdown token
   - Confirm to Saving - Confirms the drawdown to saving account

2. **clear_error_log.sh** - Manages error logs by archiving existing logs and creating new ones.

## Requirements

- Bash shell environment
- `curl` for making API requests
- `jq` for parsing JSON responses
- `uuidgen` for generating unique identifiers

## Installation

1. Clone this repository to your local machine:
   ```
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Make the scripts executable:
   ```
   chmod +x ktb-drawdown.sh
   chmod +x clear_error_log.sh
   ```

3. Install dependencies (if not already installed):

   **For macOS:**
   ```
   brew install jq curl
   ```

   **For Ubuntu/Debian:**
   ```
   apt-get update
   apt-get install jq curl uuid-runtime
   ```

   **For CentOS/RHEL:**
   ```
   yum install jq curl util-linux
   ```

   Note: You may need to run these commands with appropriate permissions if you don't have sufficient privileges.

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

- **ktb section**: Configuration for `ktb-drawdown.sh`
- **vb section**: Configuration for `vb-drawdown.sh`

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

Available targets:
- `make ktb` - Run KTB drawdown script
- `make vb` - Run VB drawdown script
- `make all` - Run both KTB and VB drawdown scripts
- `make clear-logs` - Clear error logs
- `make setup` - Install dependencies and make scripts executable
- `make validate` - Validate config.json file

### Running the Lending Flow

There are two scripts available for executing the lending flow:

#### KTB Drawdown Script

To execute the KTB lending flow:

```
./ktb-drawdown.sh
```

Or using the Makefile:

```
make ktb
```

#### VB Drawdown Script

To execute the VB lending flow:

```
./vb-drawdown.sh
```

Or using the Makefile:

```
make vb
```

Both scripts will:
1. Initiate a drawdown request
2. Submit a plan selection
3. Confirm the drawdown to a saving account (or biller for VB when configured)
4. Display a summary of the execution

The scripts will automatically handle errors and log them to `error_log.txt`.

### Managing Error Logs

The `clear_error_log.sh` script is automatically called when an error occurs in the ktb-drawdown script. However, you can also run it manually:

```
./clear_error_log.sh
```

Or using the Makefile:

```
make clear-logs
```

This will:
1. Archive the current error log with a timestamp
2. Create a new empty error log file
3. Store archived logs in the `error_logs_archive` directory

## Error Handling

When an API call fails:
1. The error is logged to `error_log.txt`
2. The current log is archived with a timestamp
3. A new log file is created
4. The script execution is terminated with an error message

## Example Output

A successful execution of either script will display output similar to the following (example from ktb-drawdown.sh):

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

## Troubleshooting

If you encounter issues:

1. Check the `error_log.txt` file for detailed error information
2. Verify your network connection to the API endpoints
3. Ensure all required dependencies are installed
4. Check that the API credentials and parameters are correct

## License

[Include license information here]
