const bedrock = require('bedrock-protocol');
const fs = require('fs');
const path = require('path');

const pluginManager = require('./utils/pluginManager');
const { loadServerProperties } = require('./utils/fileManager');
const { handlePlayerCommands } = require('./commands/handleCommands');
const { loadWorld } = require('./utils/worldManager');
const { handleCrash } = require('./utils/crashHandler');

const serverProperties = loadServerProperties();
const server = bedrock.createServer({
  port: serverProperties['server-port'],
  maxPlayers: parseInt(serverProperties['max-players']),
  motd: serverProperties['server-name'],
  version: '1.21.30'
});

const worldPath = path.join(__dirname, 'world');
if (!fs.existsSync(worldPath)) {
  fs.mkdirSync(worldPath);
  console.log('World folder created.');
}

// Load plugins
pluginManager.loadPlugins(server, path.join(__dirname, 'plugins'));

// Load the main world
loadWorld(server, 'main');

// Handle player login
server.on('login', (client) => {
  console.log(`${client.profile.name} joined the game.`);

  // Load player data and commands
  handlePlayerCommands(client);

  // Handle inventory
  require('./utils/inventoryManager').handleInventory(client);
});

// Handle server crashes
process.on('uncaughtException', (err) => {
  handleCrash(err);
});
