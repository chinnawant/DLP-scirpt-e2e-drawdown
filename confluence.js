/**
 * Confluence API utility functions for DCB Lending System
 * This module provides functions for reading content from Confluence pages
 */

const axios = require('axios');
const { colors, loadConfig, makeApiRequest } = require('./utils');
const fs = require('fs-extra');

/**
 * Connect to Confluence API
 * @returns {Promise<object>} Confluence API configuration
 */
async function connectToConfluence() {
  try {
    // Load configuration
    const config = await loadConfig();

    // Check if confluence configuration exists
    if (!config.confluence) {
      console.log(colors.yellow('Confluence configuration not found in config.json. Using default values.'));

      // Add default confluence configuration
      config.confluence = {
        base_url: config.confluence.base_url,
        username: config.confluence.username,
        api_token: config.confluence.api_token,
        space_key: 'TM'
      };

      // Save the updated configuration
      await fs.writeFile('config.json', JSON.stringify(config, null, 2), 'utf8');
      console.log(colors.green('Added default Confluence configuration to config.json. Please update with your actual values.'));
    }

    return config.confluence;
  } catch (error) {
    console.log(colors.red(`Error connecting to Confluence: ${error.message}`));
    throw error;
  }
}

/**
 * Get Confluence page content by ID
 * @param {string} pageId - Confluence page ID
 * @returns {Promise<object>} Page content
 */
async function getPageById(pageId) {
  try {
    const confluenceConfig = await connectToConfluence();

    console.log(colors.green('===== Confluence Page Retrieval ====='));
    console.log(colors.yellow(`Retrieving page with ID: ${pageId}`));

    // Make API request to get page content
    // Ensure base_url doesn't end with a slash
    const baseUrl = confluenceConfig.base_url.endsWith('/') 
      ? confluenceConfig.base_url.slice(0, -1) 
      : confluenceConfig.base_url;

    const response = await makeApiRequest(
      'get',
      `${baseUrl}/rest/api/content/${pageId}?expand=body.storage`,
      {
        'Authorization': `Basic ${Buffer.from(`${confluenceConfig.username}:${confluenceConfig.api_token}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    );

    if (response.status !== 200) {
      throw new Error(`Failed to retrieve page: ${response.data.message || 'Unknown error'}`);
    }

    console.log(colors.green(`Successfully retrieved page: ${response.data.title}`));
    return response.data;
  } catch (error) {
    console.log(colors.red(`Error retrieving Confluence page: ${error.message}`));
    throw error;
  }
}

/**
 * Get Confluence page content by title
 * @param {string} title - Page title
 * @param {string} spaceKey - Space key (optional, uses config if not provided)
 * @returns {Promise<object>} Page content
 */
async function getPageByTitle(title, spaceKey) {
  try {
    const confluenceConfig = await connectToConfluence();
    const space = spaceKey || confluenceConfig.space_key;

    console.log(colors.green('===== Confluence Page Retrieval ====='));
    console.log(colors.yellow(`Searching for page with title: "${title}" in space: ${space}`));

    // Make API request to search for the page
    // Ensure base_url doesn't end with a slash
    const baseUrl = confluenceConfig.base_url.endsWith('/') 
      ? confluenceConfig.base_url.slice(0, -1) 
      : confluenceConfig.base_url;

    const response = await makeApiRequest(
      'get',
      `${baseUrl}/rest/api/content?title=${encodeURIComponent(title)}&spaceKey=${space}&expand=body.storage`,
      {
        'Authorization': `Basic ${Buffer.from(`${confluenceConfig.username}:${confluenceConfig.api_token}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    );

    if (response.status !== 200) {
      throw new Error(`Failed to search for page: ${response.data.message || 'Unknown error'}`);
    }

    if (response.data.results.length === 0) {
      throw new Error(`No page found with title "${title}" in space ${space}`);
    }

    console.log(colors.green(`Found page: ${response.data.results[0].title}`));
    return response.data.results[0];
  } catch (error) {
    console.log(colors.red(`Error retrieving Confluence page: ${error.message}`));
    throw error;
  }
}

/**
 * Extract plain text content from Confluence page HTML
 * @param {object} page - Confluence page object
 * @returns {string} Plain text content
 */
function extractPlainText(page) {
  try {
    if (!page || !page.body || !page.body.storage || !page.body.storage.value) {
      throw new Error('Invalid page structure');
    }

    // Simple HTML to text conversion (for more complex needs, consider using a library like cheerio)
    let text = page.body.storage.value;

    // Remove HTML tags
    text = text.replace(/<[^>]*>/g, ' ');

    // Replace HTML entities
    text = text.replace(/&nbsp;/g, ' ')
               .replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"');

    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  } catch (error) {
    console.log(colors.red(`Error extracting plain text: ${error.message}`));
    return '';
  }
}

/**
 * Extract raw HTML content from Confluence page
 * @param {object} page - Confluence page object
 * @returns {string} Raw HTML content from body.storage.value
 */
function extractBodyStorageValue(page) {
  try {
    if (!page || !page.body || !page.body.storage || !page.body.storage.value) {
      throw new Error('Invalid page structure');
    }

    // Return the raw HTML content
    return page.body.storage.value;
  } catch (error) {
    console.log(colors.red(`Error extracting body storage value: ${error.message}`));
    return '';
  }
}

/**
 * Extract the header row and last row of a table that follows "Revolving loan - KTB" or "Revolving loan - VB" heading
 * @param {string} htmlContent - Raw HTML content from body.storage.value
 * @param {string} type - Type of loan to extract ('ktb' or 'vb'). If not provided, will check for both.
 * @returns {object} Object containing headerRow and lastRow as HTML
 */
function extractLastTableRow(htmlContent, type = '', env) {
  try {
    if (!htmlContent) {
      throw new Error('Invalid HTML content');
    }

    let result = {
      headerRow: '',
      lastRow: ''
    };

    // Check for "Revolving loan - KTB" or "Revolving loan - VB"
    // The pattern looks for the heading followed by any content until a table is found
    const ktbPattern = /<h1>Revolving loan - KTB<\/h1>[\s\S]*?<table[\s\S]*?>([\s\S]*?)<\/table>/;
    const vbPattern = /<h1>Revolving loan - VB<\/h1>[\s\S]*?<table[\s\S]*?>([\s\S]*?)<\/table>/;

    // Convert type to lowercase for case-insensitive comparison
    const lowerType = type.toLowerCase();

    // Only check for the specified type, or both if no type is specified
    let ktbMatch = null;
    let vbMatch = null;

    if (lowerType === '' || lowerType === 'ktb') {
      ktbMatch = htmlContent.match(ktbPattern);
    }

    if (lowerType === '' || lowerType === 'vb') {
      vbMatch = htmlContent.match(vbPattern);
    }

    if (ktbMatch) {
      // Extract the table content (inside the table tags)
      const tableContent = ktbMatch[1];
      // Find all rows in the table
      const rows = tableContent.match(/<tr[\s\S]*?>([\s\S]*?)<\/tr>/g);

      if (rows && rows.length > 0) {
        // Get the header row (first row)
        result.headerRow = rows[0];
        // Get the last row (if there are multiple rows)
        result.lastRow = rows.find((item => item.includes(env.toUpperCase())))
        console.log(colors.green('Found header and last row for Revolving loan - KTB'));
      }
    } else if (vbMatch) {
      // Extract the table content (inside the table tags)
      const tableContent = vbMatch[1];
      // Find all rows in the table
      const rows = tableContent.match(/<tr[\s\S]*?>([\s\S]*?)<\/tr>/g);

      if (rows && rows.length > 0) {
        // Get the header row (first row)
        result.headerRow = rows[0];
        // Get the last row (if there are multiple rows)
        result.lastRow = rows.find((item => item.includes(env.toUpperCase())))
        console.log(colors.green('Found header and last row for Revolving loan - VB'));
      }
    }

    // Clean up the rows by removing unnecessary whitespace
    if (result.headerRow) {
      result.headerRow = result.headerRow.trim();
    }
    if (result.lastRow) {
      result.lastRow = result.lastRow.trim();
    }

    return result;
  } catch (error) {
    console.log(colors.red(`Error extracting table rows: ${error.message}`));
    return { headerRow: '', lastRow: '' };
  }
}

/**
 * Save Confluence page content to a file
 * @param {object} page - Confluence page object
 * @param {string} filename - Output filename (optional)
 * @returns {Promise<string>} Path to the saved file
 */
async function savePageToFile(page, filename) {
  try {
    if (!page || !page.title) {
      throw new Error('Invalid page object');
    }

    // Generate filename if not provided
    const outputFilename = filename || `./confluence_pages/${page.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;

    // Create directory if it doesn't exist
    const dir = require('path').dirname(outputFilename);
    await fs.ensureDir(dir);

    // Save page data to file
    await fs.writeFile(outputFilename, JSON.stringify(page, null, 2), 'utf8');
    console.log(colors.green(`Saved page content to ${outputFilename}`));

    return outputFilename;
  } catch (error) {
    console.log(colors.red(`Error saving page to file: ${error.message}`));
    throw error;
  }
}

/**
 * Convert table rows to JSON object
 * @param {object} tableRows - Object containing headerRow and lastRow as HTML
 * @returns {object} JSON object with column names as keys and data row values as values
 */
function convertTableRowToJson(tableRows) {
  try {
    if (!tableRows || !tableRows.headerRow || !tableRows.lastRow) {
      throw new Error('Invalid table rows');
    }

    // Extract column names from header row
    const headerCells = tableRows.headerRow.match(/<th[\s\S]*?>([\s\S]*?)<\/th>/g) || [];
    const columnNames = headerCells.map(cell => {
      // Extract text content from the cell
      const textMatch = cell.match(/<th[\s\S]*?>([\s\S]*?)<\/th>/);
      if (textMatch && textMatch[1]) {
        // Remove any HTML tags and trim whitespace
        return textMatch[1].replace(/<[^>]*>/g, '').trim();
      }
      return '';
    }).filter(name => name !== '');

    // Extract values from data row
    const dataCells = tableRows.lastRow.match(/<td[\s\S]*?>([\s\S]*?)<\/td>/g) || [];
    const values = dataCells.map(cell => {
      // Extract text content from the cell
      const textMatch = cell.match(/<td[\s\S]*?>([\s\S]*?)<\/td>/);
      if (textMatch && textMatch[1]) {
        // Remove any HTML tags and trim whitespace
        return textMatch[1].replace(/<[^>]*>/g, '').trim();
      }
      return '';
    });

    // Create JSON object
    const result = {};
    columnNames.forEach((name, index) => {
      if (index < values.length) {
        result[name] = values[index];
      }
    });

    return result;
  } catch (error) {
    console.log(colors.red(`Error converting table rows to JSON: ${error.message}`));
    return {};
  }
}

module.exports = {
  connectToConfluence,
  getPageById,
  getPageByTitle,
  extractPlainText,
  extractBodyStorageValue,
  extractLastTableRow,
  convertTableRowToJson,
  savePageToFile
};
