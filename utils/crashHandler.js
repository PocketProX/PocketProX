const fs = require('fs');
const path = require('path');

function handleCrash(error) {
  const crashdumpPath = path.join(__dirname, '../crashdump');
  if (!fs.existsSync(crashdumpPath)) {
    fs.mkdirSync(crashdumpPath);
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const crashFile = path.join(crashdumpPath, `crash-${timestamp}.log`);
  const logData = `
  Crash Type: uncaughtException
  Timestamp: ${new Date().toLocaleString()}
  Error: ${error.message || error}
  Stack: ${error.stack || 'No stack trace available'}
  `;
  fs.writeFileSync(crashFile, logData);
  console.error(`A crash occurred. See details in ${crashFile}`);
}

module.exports = { handleCrash };
