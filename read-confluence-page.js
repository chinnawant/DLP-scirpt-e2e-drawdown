/**
 * Example script for reading content from a Confluence page
 * This script demonstrates how to use the confluence.js module
 */

const { colors, updateConfig, loadConfig} = require('./utils');
const { 
  getPageById, 
  getPageByTitle, 
  extractPlainText, 
  extractBodyStorageValue,
  extractLastTableRow,
  convertTableRowToJson,
} = require('./confluence');

/**
 * Main function to read a Confluence page
 */
async function readConfluencePage() {
  try {
    const config = await loadConfig();
    const configJson = config[config.confluence.content];
    console.log(colors.green('===== Confluence Page Reader ====='));

    // Method 1: Get page by ID
    // Replace 'your-page-id' with an actual Confluence page ID
    const pageId = process.argv[2] || '4425713968';
    // Get the type of loan to extract (ktb or vb)
    const loanType = process.argv[4] || '';
    console.log(colors.yellow(`Attempting to read page with ID: ${pageId}`));
    if (loanType) {
      console.log(colors.yellow(`Extracting data for loan type: ${loanType}`));
    }

    try {
      const pageById = await getPageById(pageId);
      console.log(colors.green('Page details:'));
      console.log(colors.yellow(`Title: ${pageById.title || 'Unknown'}`));

      // Check if version information exists before accessing it
      if (pageById.version && pageById.version.when) {
        console.log(colors.yellow(`Last updated: ${pageById.version.when}`));
      } else {
        console.log(colors.yellow('Last updated: Unknown'));
      }

      if (pageById.version && pageById.version.by && pageById.version.by.displayName) {
        console.log(colors.yellow(`By: ${pageById.version.by.displayName}`));
      } else {
        console.log(colors.yellow('By: Unknown'));
      }

      // Extract plain text
      const plainText = extractPlainText(pageById);
      console.log(colors.green('Page content preview (plain text):'));
      console.log(colors.yellow(plainText.substring(0, 200) + '...'));

      // Extract raw HTML content
      const rawHtml = extractBodyStorageValue(pageById);
      console.log(colors.green('Raw HTML content preview:'));
      console.log(colors.yellow(rawHtml.substring(0, 200) + '...'));

      // Extract table rows if it contains "Revolving loan - KTB" or "Revolving loan - VB"
      const tableRows = extractLastTableRow(rawHtml, loanType, config.confluence.env);
      if (tableRows && tableRows.headerRow && tableRows.lastRow) {
        console.log(colors.green(`Header row of the table${loanType ? ` for ${loanType.toUpperCase()}` : ''}:`));
        console.log(colors.yellow(tableRows.headerRow));

        console.log(colors.green(`Last row of the table${loanType ? ` for ${loanType.toUpperCase()}` : ''}:`));
        console.log(colors.yellow(tableRows.lastRow));

        // Convert table rows to JSON
        const jsonData = convertTableRowToJson(tableRows);
        console.log(colors.green(`Table data as JSON${loanType ? ` for ${loanType.toUpperCase()}` : ''}:`));
        console.log(colors.yellow(JSON.stringify(jsonData, null, 2)));
        await updateConfig(config.confluence.content, 'supervisorContractId', jsonData["Supervisor Version"]);
        await updateConfig(config.confluence.content, 'drawdownSmartContractId', jsonData["Drawdown Version"]);
        await updateConfig(config.confluence.content, 'locSmartContractId', jsonData["LOC Version"]);

      }

      // await updateConfig([config.confluence.content, 'contract_ref_id', responseContractRefId);

    } catch (error) {
      console.log(colors.red(`Error getting page by ID: ${error.message}`));
      console.log(colors.yellow('Trying to get page by title instead...'));

      // Method 2: Get page by title
      // Use the title from the page we retrieved by ID, or fall back to a known title
      const pageTitle = process.argv[3] || (pageById && pageById.title ? pageById.title : 'Line of Credit - Release Note');
      try {
        const pageByTitle = await getPageByTitle(pageTitle);
        console.log(colors.green('Page details:'));
        console.log(colors.yellow(`Title: ${pageByTitle.title || 'Unknown'}`));

        // Check if version information exists before accessing it
        if (pageByTitle.version && pageByTitle.version.when) {
          console.log(colors.yellow(`Last updated: ${pageByTitle.version.when}`));
        } else {
          console.log(colors.yellow('Last updated: Unknown'));
        }

        if (pageByTitle.version && pageByTitle.version.by && pageByTitle.version.by.displayName) {
          console.log(colors.yellow(`By: ${pageByTitle.version.by.displayName}`));
        } else {
          console.log(colors.yellow('By: Unknown'));
        }

        // Extract plain text
        const plainText = extractPlainText(pageByTitle);
        console.log(colors.green('Page content preview (plain text):'));
        console.log(colors.yellow(plainText.substring(0, 200) + '...'));

        // Extract raw HTML content
        const rawHtml = extractBodyStorageValue(pageByTitle);
        console.log(colors.green('Raw HTML content preview:'));
        console.log(colors.yellow(rawHtml.substring(0, 200) + '...'));

        // Extract table rows if it contains "Revolving loan - KTB" or "Revolving loan - VB"
        const tableRows = extractLastTableRow(rawHtml, loanType);
        if (tableRows && tableRows.headerRow && tableRows.lastRow) {
          console.log(colors.green(`Header row of the table${loanType ? ` for ${loanType.toUpperCase()}` : ''}:`));
          console.log(colors.yellow(tableRows.headerRow));

          console.log(colors.green(`Last row of the table${loanType ? ` for ${loanType.toUpperCase()}` : ''}:`));
          console.log(colors.yellow(tableRows.lastRow));

          // Convert table rows to JSON
          const jsonData = convertTableRowToJson(tableRows);
          console.log(colors.green(`Table data as JSON${loanType ? ` for ${loanType.toUpperCase()}` : ''}:`));
          console.log(colors.yellow(JSON.stringify(jsonData, null, 2)));
        }

        // Save to file
      } catch (titleError) {
        console.log(colors.red(`Error getting page by title: ${titleError.message}`));
        console.log(colors.yellow('Please check your Confluence configuration in config.json'));
        console.log(colors.yellow('Make sure you have set the correct base_url, username, api_token, and space_key'));
      }
    }

    console.log(colors.green('===== End of Confluence Page Reader ====='));
  } catch (error) {
    console.log(colors.red(`Unhandled error: ${error.message}`));
    process.exit(1);
  }
}

// Execute the main function if this script is run directly
if (require.main === module) {
  readConfluencePage();
}

// Export the function for use in other scripts
module.exports = { readConfluencePage };
