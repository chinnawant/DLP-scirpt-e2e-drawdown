# Makefile for DCB Lending System API Scripts
K8S_NAMESPACE = default
K8S_CERT_NAME = nginx-certs


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
	@echo "  confluence - Read content from a Confluence page"
	@echo "  upload-file - Upload file to Kubernetes nginx pod (Usage: make upload-file FILE=path/to/file DEST=destination/path [FORCE=-f])"

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

# Read content from a Confluence page
.PHONY: confluence
confluence:
	@echo "Reading content from a Confluence page..."
	node read-confluence-page.js

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

# Upload specific file to Kubernetes nginx
.PHONY: upload-file
upload-file:
	@if [ -z "$(FILE)" ]; then \
		echo "Error: FILE parameter is required. Usage: make upload-file FILE=path/to/file DEST=destination/path [FORCE=-f]"; \
		exit 1; \
	fi
	@if [ -z "$(DEST)" ]; then \
		echo "Error: DEST parameter is required. Usage: make upload-file FILE=path/to/file DEST=destination/path [FORCE=-f]"; \
		exit 1; \
	fi
	@echo "Uploading file $(FILE) to nginx pods in $(K8S_NAMESPACE) namespace at $(DEST)..."
	@POD_NAME=$$(kubectl get pods -n $(K8S_NAMESPACE) | grep nginx | head -n 1 | awk '{print $$1}'); \
	if [ -z "$$POD_NAME" ]; then \
		echo "Error: No nginx pods found in $(K8S_NAMESPACE) namespace"; \
		exit 1; \
	fi; \
	echo "Using pod: $$POD_NAME"; \
	if [ "$(FORCE)" = "-f" ]; then \
		echo "Force flag detected. Removing destination file first..."; \
		kubectl exec -n $(K8S_NAMESPACE) $$POD_NAME -- rm -f $(DEST); \
	fi; \
	kubectl cp $(FILE) $(K8S_NAMESPACE)/$$POD_NAME:$(DEST)
