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
	@echo "  create-account - Create a new LOC account"
	@echo "  clear-logs - Clear error logs"
	@echo "  delete-data - Delete loan account data from databases"
	@echo "  setup      - Install dependencies"
	@echo "  setup-apt  - Install dependencies using apt-get (Ubuntu/Debian)"
	@echo "  validate   - Validate config.json file"
	@echo "  all        - Run both KTB and VB drawdown scripts"
	@echo "  upload     - Upload certificates to Kubernetes pod"

# Run KTB drawdown script
.PHONY: ktb
ktb:
	@echo "Running KTB drawdown script..."
	node ktb-drawdown.js

# Run VB drawdown script
.PHONY: vb
vb:
	@echo "Running VB drawdown script..."
	node vb-drawdown.js

# Create a new LOC account
.PHONY: create-account
create-account:
	@echo "Creating a new LOC account..."
	node create-account.js

# Run both scripts
.PHONY: all
all: ktb vb

# Clear error logs
.PHONY: clear-logs
clear-logs:
	@echo "Clearing error logs..."
	node clear-error-log.js

# Delete loan account data
.PHONY: delete-data
delete-data:
	@echo "Deleting loan account data from databases..."
	node delete-loan-data.js

# Setup dependencies
.PHONY: setup
setup:
	@echo "Setting up dependencies..."
	@echo "Checking for required tools..."
	@which node > /dev/null || (echo "node not found. Please install Node.js." && exit 1)
	@which npm > /dev/null || (echo "npm not found. Please install npm." && exit 1)
	@which psql > /dev/null || (echo "psql not found. Please install PostgreSQL client." && echo "Note: psql is only required for delete-loan-data.js")
	@echo "All required tools are installed."
	@echo "Installing Node.js dependencies..."
	@npm install
	@echo "Setup complete."

# Setup dependencies using apt-get (Ubuntu/Debian)
.PHONY: setup-apt
setup-apt:
	@echo "Setting up dependencies using apt-get..."
	@echo "This command requires sudo privileges to install packages."
	@echo "Installing Node.js, npm, and PostgreSQL client..."
	@apt-get update
	@apt-get install -y nodejs npm postgresql-client
	@echo "Installing Node.js dependencies..."
	@npm install
	@echo "Setup complete."

# Validate config.json
.PHONY: validate
validate:
	@echo "Validating config.json..."
	@node validate-config.js

# Upload certificates to Kubernetes pod
.PHONY: upload
upload:
	@echo "Uploading certificates to Kubernetes pod..."
	@POD_NAME=$$(kubectl get pods -n default | grep nginx | head -n 1 | awk '{print $$1}') && \
	echo "Using pod: $$POD_NAME" && \
kubectl cp ../script-curl default/$$POD_NAME:/root/sq2 || kubectl cp ../script-curl default/$$POD_NAME:/root/sq2
	@echo Done upload
