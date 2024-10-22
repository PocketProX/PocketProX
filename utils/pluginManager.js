const fs = require('fs');
const path = require('path');

function loadPlugins(server, pluginsPath) {
  fs.readdirSync(pluginsPath).forEach(file => {
    if (file.endsWith('.js')) {
      const plugin = require(path.join(pluginsPath, file));
      plugin(server);
    }
  });
}

module.exports = { loadPlugins };
