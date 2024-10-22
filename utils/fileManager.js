const fs = require('fs');
const path = require('path');

function loadServerProperties() {
  const properties = {};
  const lines = fs.readFileSync(path.join(__dirname, '../server.properties'), 'utf-8').split('\n');
  lines.forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      properties[key.trim()] = value.trim();
    }
  });
  return properties;
}

module.exports = { loadServerProperties };
