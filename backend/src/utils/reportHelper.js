/**
 * Helper utility for reports and analytics: date range parsing & export formatting
 */

/**
 * Safely parses startDate and endDate query parameters
 * @param {string} startDateStr
 * @param {string} endDateStr
 * @returns {Object} { start, end, dateFilter, error, statusCode }
 */
const parseDateRange = (startDateStr, endDateStr) => {
  let start = null;
  let end = null;

  if (startDateStr) {
    const parsedStart = new Date(startDateStr);
    if (isNaN(parsedStart.getTime())) {
      return { error: 'Invalid start date format', statusCode: 400 };
    }
    parsedStart.setHours(0, 0, 0, 0);
    start = parsedStart;
  }

  if (endDateStr) {
    const parsedEnd = new Date(endDateStr);
    if (isNaN(parsedEnd.getTime())) {
      return { error: 'Invalid end date format', statusCode: 400 };
    }
    parsedEnd.setHours(23, 59, 59, 999);
    end = parsedEnd;
  }

  if (start && end && end < start) {
    return { error: 'End date cannot be earlier than start date', statusCode: 400 };
  }

  const dateFilter = {};
  if (start || end) {
    dateFilter.createdAt = {};
    if (start) dateFilter.createdAt.$gte = start;
    if (end) dateFilter.createdAt.$lte = end;
  }

  return { start, end, dateFilter };
};

/**
 * Formats a report into CSV format for Excel downloads
 */
const generateCSVReport = ({ title, summary = {}, headers = [], rows = [] }) => {
  const lines = [];

  // Report Title & Date
  lines.push(`"${title.replace(/"/g, '""')}"`);
  lines.push(`"Generated At: ${new Date().toISOString()}"`);
  lines.push('');

  // Summary Metrics
  if (summary && Object.keys(summary).length > 0) {
    lines.push('"--- SUMMARY METRICS ---"');
    for (const [key, value] of Object.entries(summary)) {
      lines.push(`"${key}","${value}"`);
    }
    lines.push('');
  }

  // Table Headers
  if (headers && headers.length > 0) {
    lines.push(headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','));
  }

  // Data Rows
  if (rows && rows.length > 0) {
    for (const row of rows) {
      const formattedRow = row.map((cell) => {
        if (cell === null || cell === undefined) return '""';
        return `"${String(cell).replace(/"/g, '""')}"`;
      });
      lines.push(formattedRow.join(','));
    }
  }

  return lines.join('\n');
};

/**
 * Formats a report into PDF format (Text/Structured document layout)
 */
const generatePDFReport = ({ title, summary = {}, headers = [], rows = [] }) => {
  const content = [];

  content.push(`=================================================================`);
  content.push(`                       ${title.toUpperCase()}                   `);
  content.push(`Generated: ${new Date().toLocaleString()}`);
  content.push(`=================================================================\n`);

  if (summary && Object.keys(summary).length > 0) {
    content.push(`SUMMARY METRICS:`);
    content.push(`-----------------------------------------------------------------`);
    for (const [key, value] of Object.entries(summary)) {
      content.push(`  * ${key}: ${value}`);
    }
    content.push(`-----------------------------------------------------------------\n`);
  }

  if (headers && headers.length > 0) {
    content.push(headers.join(' | '));
    content.push('-'.repeat(Math.max(65, headers.join(' | ').length)));
  }

  if (rows && rows.length > 0) {
    for (const row of rows) {
      content.push(row.map((cell) => (cell !== null && cell !== undefined ? String(cell) : '')).join(' | '));
    }
  }

  content.push(`\n=================================================================`);
  content.push(`End of Report - Local Artisan Marketplace Analytics`);
  content.push(`=================================================================`);

  return content.join('\n');
};

module.exports = {
  parseDateRange,
  generateCSVReport,
  generatePDFReport
};
