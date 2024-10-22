const fs = require('fs');
const path = require('path');

function loadWorld(server, worldName) {
  const worldPath = path.join(__dirname, '../world', worldName);
  if (!fs.existsSync(worldPath)) {
    fs.mkdirSync(worldPath, { recursive: true });
    console.log(`World ${worldName} created.`);
  } else {
    console.log(`World ${worldName} loaded.`);
  }
}

module.exports = { loadWorld };
