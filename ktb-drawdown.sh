#!/bin/bash

# Flow Curl Script for DCB Lending System
# This script demonstrates a typical lending flow by making API calls to various services
#
# Flow Overview:
# 1. Drawdown Installmentation - Initiates a drawdown request with account and amount details
# 2. Submit Plan Selection - Selects a repayment plan using the drawdown token from step 1
# 3. Confirm to Saving - Confirms the drawdown to saving account using the drawdown token

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Set variables for API requests from config.json
CONFIG_FILE="config.json"

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}Error: Config file $CONFIG_FILE not found${NC}"
    exit 1
fi

# Read variables from config file
BASE_URL=$(jq -r '.ktb.base_url' "$CONFIG_FILE")
LOC_ACCOUNT_NO=$(jq -r '.ktb.loc_account_no' "$CONFIG_FILE")
DISBURSE_AMOUNT=$(jq -r '.ktb.disburse_amount' "$CONFIG_FILE")
TO_ACCOUNT_NO=$(jq -r '.ktb.to_account_no' "$CONFIG_FILE")
PRODUCT_MARKET_CODE=$(jq -r '.ktb.product_market_code' "$CONFIG_FILE")
SELECTED_PLAN_ID=$(jq -r '.ktb.selected_plan_id' "$CONFIG_FILE")

# Generate random UUIDs for headers
CHANNEL_TXN_REF_ID=$(uuidgen)
TRACE_PARENT_UUID="00-$(uuidgen | tr -d '-' | cut -c1-32)-$(uuidgen | tr -d '-' | cut -c1-16)-01"

# Function to generate a new request ID
generate_request_id() {
    uuidgen
}

# Function to add delay and log request body
delay_and_log() {
    local step_name=$1
    local request_body=$2

    echo -e "${YELLOW}Adding 3-second delay before API call...${NC}"
    echo -e "${YELLOW}Request body for $step_name:${NC}"
    echo "$request_body" | jq '.' || echo "$request_body"
    echo -e "${YELLOW}Waiting for 3 seconds...${NC}"
    sleep 1
}

# Function to check response and extract values
check_response() {
    local response=$1
    local key=$2
    local default_value=$3
    local var_name=$4

    # Check if response is a curl error (starts with "curl:")
    if [ "$(echo "$response" | grep -c "^curl:")" -gt 0 ]; then
        echo -e "${RED}Network error in response: $response${NC}"

        # Log error to file
        local log_file="error_log.txt"
        echo "$(date): Network error in $var_name - $response" >> $log_file

        # Run script to clear log error
        ./clear_error_log.sh

        # Return default value instead of breaking execution
        echo -e "${YELLOW}Continuing execution with default value for $var_name${NC}"
        echo "$default_value"
        return
    fi

    # Check if response contains an error
    local error_code=$(echo $response | jq -r '.code // ""')
    local error_message=$(echo $response | jq -r '.message // ""')

    if [ "$error_code" != "0000" ] && [ "$error_code" != "" ]; then
        echo -e "${RED}Error in response: Code $error_code - $error_message${NC}"

        # Log error to file
        local log_file="error_log.txt"
        echo "$(date): Error in $var_name - Code $error_code - $error_message" >> $log_file
        echo "Response: $response" >> $log_file

        # Run script to clear log error
        ./clear_error_log.sh

        # Break execution
        echo -e "${RED}Breaking execution due to error${NC}"
        exit 1
    fi

    # Extract the value
    local extracted_value=$(echo $response | jq -r "$key // \"$default_value\"")

    # Check if default value is being used
    if [ "$extracted_value" = "$default_value" ]; then
        echo -e "${YELLOW}Warning: Using default value for $var_name because it couldn't be extracted from the response${NC}"
    fi

    echo $extracted_value
}

# Step 1: Drawdown Installmentation
echo -e "${GREEN}===== Step 1: Drawdown Installmentation =====${NC}"
echo -e "${YELLOW}Calling POST https://intgw-dlp-sit.ktb-core-bank.nonprod.aws.ktbcloud/dcb/lending/v1/drawdown/installmentation${NC}"
REQUEST_ID_1=$(generate_request_id)
echo -e "${YELLOW}Using request ID: ${REQUEST_ID_1}${NC}"

# Prepare request body
REQUEST_BODY_1='{
    "locAccountNo": "'$LOC_ACCOUNT_NO'",
    "toAccountNo": "'$TO_ACCOUNT_NO'",
    "productMarketCode": "'$PRODUCT_MARKET_CODE'",
    "disburseAmount": '$DISBURSE_AMOUNT',
    "currency": "THB",
    "channelId": "KTB"
}'

# Add delay and log request body
delay_and_log "Step 1: Drawdown Installmentation" "$REQUEST_BODY_1"

response=$(curl  -k  --location 'https://intgw-dlp-sit.ktb-core-bank.nonprod.aws.ktbcloud/dcb/lending/v1/drawdown/installmentation' \
--header "x-request-id: ${REQUEST_ID_1}" \
--header 'x-channel-id: PT' \
--header "x-traceparent: ${TRACE_PARENT_UUID}" \
--header 'x-devops-src: bib' \
--header 'x-devops-dest: ktb-dlp' \
--header 'x-devops-key: RbRrmnA2HKy0O1medxxd04Zyd52BVLht' \
--header 'Content-Type: application/json' \
--data "$REQUEST_BODY_1")
echo -e "${GREEN}Response:${NC}"
echo $response | jq '.' || echo $response
echo ""

# Step 2: Submit Plan Selection
echo -e "${GREEN}===== Step 2: Submit Plan Selection =====${NC}"
# Extract drawdownToken from step 1 response
DRAWDOWN_TOKEN=$(check_response "$response" '.data.drawdownToken' "" "DRAWDOWN_TOKEN")
echo -e "${YELLOW}Extracted drawdownToken: ${DRAWDOWN_TOKEN}${NC}"

# Check if drawdownToken was successfully extracted
if [ -z "$DRAWDOWN_TOKEN" ] || [ "$DRAWDOWN_TOKEN" = "null" ]; then
    echo -e "${RED}Error: Failed to extract drawdownToken from previous response${NC}"
    echo -e "${RED}Response was: ${response}${NC}"
    exit 1
fi

echo -e "${YELLOW}Calling POST ${BASE_URL}/dcb/lending/v1/drawdown/submit-to-saving${NC}"
REQUEST_ID_2=$(generate_request_id)
echo -e "${YELLOW}Using request ID: ${REQUEST_ID_2}${NC}"

# Prepare request body
REQUEST_BODY_2='{
    "drawdownToken": "'$DRAWDOWN_TOKEN'",
    "channelTxnRefId": "'$CHANNEL_TXN_REF_ID'",
    "selectedPlanId": "'$SELECTED_PLAN_ID'"
}'

# Add delay and log request body
delay_and_log "Step 2: Submit Plan Selection" "$REQUEST_BODY_2"

response2=$(curl --location "${BASE_URL}/dcb/lending/v1/drawdown/submit-to-saving" \
--header "x-request-id: ${REQUEST_ID_2}" \
--header 'x-channel-id: PT' \
--header "x-traceparent: ${TRACE_PARENT_UUID}" \
--header 'x-devops-src: bib' \
--header 'x-devops-dest: ktb-dlp' \
--header 'x-devops-key: RbRrmnA2HKy0O1medxxd04Zyd52BVLht' \
--header 'Content-Type: application/json' \
--data "$REQUEST_BODY_2" -k)
echo -e "${GREEN}Response:${NC}"
echo $response2 | jq '.' || echo $response2
echo ""

# Check if response2 is a curl error
if [ "$(echo "$response2" | grep -c "^curl:")" -gt 0 ]; then
    echo -e "${RED}Network error in Step 2 response: $response2${NC}"

    # Log error to file
    log_file="error_log.txt"
    echo "$(date): Network error in Step 2 - $response2" >> $log_file

    # Run script to clear log error
    ./clear_error_log.sh

    # Continue execution
    echo -e "${YELLOW}Continuing execution despite network error in Step 2${NC}"
else
    # Check if response2 contains an error
    error_code=$(echo $response2 | jq -r '.code // ""')
    error_message=$(echo $response2 | jq -r '.message // ""')
    if [ "$error_code" != "0000" ] && [ "$error_code" != "" ]; then
        echo -e "${RED}Error in Step 2 response: Code $error_code - $error_message${NC}"

        # Log error to file
        log_file="error_log.txt"
        echo "$(date): Error in Step 2 - Code $error_code - $error_message" >> $log_file
        echo "Response: $response2" >> $log_file

        # Run script to clear log error
        ./clear_error_log.sh

        # Break execution
        echo -e "${RED}Breaking execution due to error${NC}"
        exit 1
    fi
fi

# Step 3: Confirm to Saving
echo -e "${GREEN}===== Step 3: Confirm to Saving =====${NC}"
echo -e ""
echo -e "${YELLOW}Calling POST ${BASE_URL}/dcb/lending/v1/drawdown/confirm-to-saving${NC}"
echo -e "${YELLOW}Extracted drawdownToken: ${DRAWDOWN_TOKEN}${NC}"
REQUEST_ID_3=$(generate_request_id)
echo -e "${YELLOW}Using request ID: ${REQUEST_ID_3}${NC}"
echo -e "${YELLOW}TRACE_PARENT_UUID: ${TRACE_PARENT_UUID}"

# Prepare request body
REQUEST_BODY_3='{
    "drawdownToken": "'$DRAWDOWN_TOKEN'",
    "note": "DISBURSEMENT"
}'

# Add delay and log request body
delay_and_log "Step 3: Confirm to Saving" "$REQUEST_BODY_3"

response3=$(curl -k --location "${BASE_URL}/dcb/lending/v1/drawdown/confirm-to-saving" \
--header "x-request-id: ${REQUEST_ID_3}" \
--header 'x-channel-id: PT' \
--header "x-traceparent: ${TRACE_PARENT_UUID}" \
--header 'x-devops-src: bib' \
--header 'x-devops-dest: ktb-dlp' \
--header 'x-devops-key: RbRrmnA2HKy0O1medxxd04Zyd52BVLht' \
--header 'Content-Type: application/json' \
--data "$REQUEST_BODY_3")
echo -e "${GREEN}Response:${NC}"
echo $response3 | jq '.' || echo $response3
echo ""

# Check if response3 is a curl error
if [ "$(echo "$response3" | grep -c "^curl:")" -gt 0 ]; then
    echo -e "${RED}Network error in Step 3 response: $response3${NC}"

    # Log error to file
    log_file="error_log.txt"
    echo "$(date): Network error in Step 3 - $response3" >> $log_file

    # Run script to clear log error
    ./clear_error_log.sh

    # Continue execution
    echo -e "${YELLOW}Continuing execution despite network error in Step 3${NC}"
else
    # Check if response3 contains an error
    error_code=$(echo $response3 | jq -r '.code // ""')
    error_message=$(echo $response3 | jq -r '.message // ""')
    if [ "$error_code" != "0000" ] && [ "$error_code" != "" ]; then
        echo -e "${RED}Error in Step 3 response: Code $error_code - $error_message${NC}"

        # Log error to file
        log_file="error_log.txt"
        echo "$(date): Error in Step 3 - Code $error_code - $error_message" >> $log_file
        echo "Response: $response3" >> $log_file

        # Run script to clear log error
        ./clear_error_log.sh

        # Break execution
        echo -e "${RED}Breaking execution due to error${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}===== Flow Completed =====${NC}"

# Print summary of the flow execution
echo -e "${GREEN}===== Flow Execution Summary =====${NC}"
echo -e "${YELLOW}LOC Account Number: ${LOC_ACCOUNT_NO}${NC}"
echo -e "${YELLOW}Disbursement Amount: ${DISBURSE_AMOUNT}${NC}"
echo -e "${YELLOW}To Account Number: ${TO_ACCOUNT_NO}${NC}"
echo -e "${YELLOW}Product Market Code: ${PRODUCT_MARKET_CODE}${NC}"
echo -e "${YELLOW}Drawdown Token: ${DRAWDOWN_TOKEN}${NC}"
echo -e "${GREEN}===== End of Summary =====${NC}"
