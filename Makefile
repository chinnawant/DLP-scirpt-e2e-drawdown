# Makefile for DCB Lending System API Scripts

# Default target
.PHONY: help
help:
	@echo "DCB Lending System API Scripts"
	@echo ""
	@echo "Available targets:"
	@echo "  help       - Show this help message"
	@echo "  ktb        - Run KTB drawdown script"
	@echo "  vb         - Run VB drawdown script"
	@echo "  clear-logs - Clear error logs"
	@echo "  setup      - Install dependencies"
	@echo "  validate   - Validate config.json file"
	@echo "  all        - Run both KTB and VB drawdown scripts"
	@echo "  upload     - Upload certificates to Kubernetes pod"

# Run KTB drawdown script
.PHONY: ktb
ktb:
	@echo "Running KTB drawdown script..."
	./ktb-drawdown.sh

# Run VB drawdown script
.PHONY: vb
vb:
	@echo "Running VB drawdown script..."
	./vb-drawdown.sh

# Run both scripts
.PHONY: all
all: ktb vb

# Clear error logs
.PHONY: clear-logs
clear-logs:
	@echo "Clearing error logs..."
	./clear_error_log.sh

# Setup dependencies
.PHONY: setup
setup:
	@echo "Setting up dependencies..."
	@echo "Checking for required tools..."
	@which jq > /dev/null || (echo "jq not found. Please install jq." && exit 1)
	@which curl > /dev/null || (echo "curl not found. Please install curl." && exit 1)
	@which uuidgen > /dev/null || (echo "uuidgen not found. Please install uuidgen." && exit 1)
	@echo "All required tools are installed."
	@chmod +x ktb-drawdown.sh vb-drawdown.sh clear_error_log.sh
	@echo "Made scripts executable."
	@echo "Setup complete."

# Validate config.json
.PHONY: validate
validate:
	@echo "Validating config.json..."
	@if [ ! -f config.json ]; then \
		echo "Error: config.json not found."; \
		exit 1; \
	fi
	@jq empty config.json 2>/dev/null || (echo "Error: Invalid JSON in config.json" && exit 1)
	@echo "Checking required fields for KTB..."
	@jq -e '.ktb.base_url' config.json > /dev/null || (echo "Error: Missing ktb.base_url in config.json" && exit 1)
	@jq -e '.ktb.loc_account_no' config.json > /dev/null || (echo "Error: Missing ktb.loc_account_no in config.json" && exit 1)
	@jq -e '.ktb.disburse_amount' config.json > /dev/null || (echo "Error: Missing ktb.disburse_amount in config.json" && exit 1)
	@jq -e '.ktb.to_account_no' config.json > /dev/null || (echo "Error: Missing ktb.to_account_no in config.json" && exit 1)
	@jq -e '.ktb.product_market_code' config.json > /dev/null || (echo "Error: Missing ktb.product_market_code in config.json" && exit 1)
	@jq -e '.ktb.selected_plan_id' config.json > /dev/null || (echo "Error: Missing ktb.selected_plan_id in config.json" && exit 1)
	@echo "Checking required fields for VB..."
	@jq -e '.vb.base_url' config.json > /dev/null || (echo "Error: Missing vb.base_url in config.json" && exit 1)
	@jq -e '.vb.loc_account_no' config.json > /dev/null || (echo "Error: Missing vb.loc_account_no in config.json" && exit 1)
	@jq -e '.vb.disburse_amount' config.json > /dev/null || (echo "Error: Missing vb.disburse_amount in config.json" && exit 1)
	@jq -e '.vb.to_account_no' config.json > /dev/null || (echo "Error: Missing vb.to_account_no in config.json" && exit 1)
	@jq -e '.vb.product_market_code' config.json > /dev/null || (echo "Error: Missing vb.product_market_code in config.json" && exit 1)
	@jq -e '.vb.selected_plan_id' config.json > /dev/null || (echo "Error: Missing vb.selected_plan_id in config.json" && exit 1)
	@jq -e '.vb.ccd_id' config.json > /dev/null || (echo "Error: Missing vb.ccd_id in config.json" && exit 1)
	@jq -e '.vb.drawdown_type' config.json > /dev/null || (echo "Error: Missing vb.drawdown_type in config.json" && exit 1)
	@echo "config.json is valid."

# Upload certificates to Kubernetes pod
.PHONY: upload
upload:
	@echo "Uploading certificates to Kubernetes pod..."
	@POD_NAME=$$(kubectl get pods -n default | grep nginx | head -n 1 | awk '{print $$1}') && \
	echo "Using pod: $$POD_NAME" && \
	kubectl cp ../script-curl default/$$POD_NAME:/root/sq2
	@echo Done upload
