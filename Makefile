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
	@echo "  ktb-create - Create a new KTB LOC account"
	@echo "  vb-create  - Create a new VB LOC account"
	@echo "  ktb-delete - Delete KTB account from databases"
	@echo "  vb-delete  - Delete VB account from databases"
	@echo "  clear-logs - Clear error logs"
	@echo "  setup      - Install dependencies"
	@echo "  setup-apt  - Install dependencies using apt-get (Ubuntu/Debian)"
	@echo "  validate   - Validate config.json file"
	@echo "  all        - Run both KTB and VB drawdown scripts"

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

# Create a new KTB LOC account
.PHONY: ktb-create
ktb-create:
	@echo "Creating a new KTB LOC account..."
	node ktb-create-account.js

# Create a new VB LOC account
.PHONY: vb-create
vb-create:
	@echo "Creating a new VB LOC account..."
	node vb-create-account.js

# Delete KTB account
.PHONY: ktb-delete
ktb-delete:
	@echo "Deleting KTB account from databases..."
	node ktb-delete-account.js

# Delete VB account
.PHONY: vb-delete
vb-delete:
	@echo "Deleting VB account from databases..."
	node vb-delete-account.js

# Run both scripts
.PHONY: all
all: ktb vb

# Clear error logs
.PHONY: clear-logs
clear-logs:
	@echo "Clearing error logs..."
	node clear-error-log.js

# Setup dependencies
.PHONY: setup
setup:
	@echo "Setting up dependencies..."
	@echo "Checking for required tools..."
	@which node > /dev/null || (echo "node not found. Please install Node.js." && exit 1)
	@which npm > /dev/null || (echo "npm not found. Please install npm." && exit 1)
	@which psql > /dev/null || (echo "psql not found. Please install PostgreSQL client." && echo "Note: PostgreSQL client library is required for ktb-delete-account.js")
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
