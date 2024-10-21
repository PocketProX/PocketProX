const bedrock = require('bedrock-protocol');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Load server properties
const properties = fs.readFileSync('server.properties', 'utf8').split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key) acc[key.trim()] = value ? value.trim() : '';
  return acc;
}, {});

// Load ops, ban, and plugins files
const opsPath = path.join(__dirname, 'ops.json');
let ops = fs.existsSync(opsPath) ? JSON.parse(fs.readFileSync(opsPath, 'utf8')) : [];

const banPath = path.join(__dirname, 'banned.json');
let banned = fs.existsSync(banPath) ? JSON.parse(fs.readFileSync(banPath, 'utf8')) : [];

// Create server
const server = bedrock.createServer({
  host: '0.0.0.0',
  port: properties['server-port'] || 19132,
  version: '1.21.30',
  motd: properties['server-name'] || 'My Bedrock Server',
  maxPlayers: properties['max-players'] || 20,
});

// Plugin system
const loadPlugins = () => {
  const pluginFolder = path.join(__dirname, 'plugins');
  if (!fs.existsSync(pluginFolder)) fs.mkdirSync(pluginFolder);

  fs.readdirSync(pluginFolder).forEach(file => {
    if (file.endsWith('.js')) {
      const plugin = require(path.join(pluginFolder, file));
      if (typeof plugin.init === 'function') {
        plugin.init(server);
        console.log(`Plugin ${file} loaded.`);
      }
    }
  });
};

// Command handling function
const handleCommand = (client, command, args) => {
  switch (command) {
    case '/op':
      if (!ops.some(op => op.name === client.username)) {
        const newOp = {
          uuid: client.uuid || uuidv4(),
          name: client.username,
          level: 4
        };
        ops.push(newOp);
        fs.writeFileSync(opsPath, JSON.stringify(ops, null, 2));
        client.write('text', { message: `${client.username} has been added as an operator.` });
      } else {
        client.write('text', { message: `${client.username} is already an operator.` });
      }
      break;

    case '/deop':
      ops = ops.filter(op => op.name !== client.username);
      fs.writeFileSync(opsPath, JSON.stringify(ops, null, 2));
      client.write('text', { message: `${client.username} has been removed from operators.` });
      break;

    case '/kick':
      const targetName = args[0];
      const target = server.clients.find(c => c.username === targetName);
      if (target) {
        target.disconnect('You have been kicked from the server.');
        client.write('text', { message: `${targetName} has been kicked.` });
      } else {
        client.write('text', { message: `${targetName} not found.` });
      }
      break;

    case '/ban':
      const bannedPlayer = args[0];
      const bannedUuid = uuidv4();  // This can be adjusted to store actual player UUIDs
      banned.push({ name: bannedPlayer, uuid: bannedUuid });
      fs.writeFileSync(banPath, JSON.stringify(banned, null, 2));
      client.write('text', { message: `${bannedPlayer} has been banned.` });
      break;

    case '/tp':
      const playerToTp = args[0];
      const targetPlayer = server.clients.find(c => c.username === playerToTp);
      if (targetPlayer) {
        client.position = targetPlayer.position; // Teleport to target player's position
        client.write('text', { message: `You have been teleported to ${targetPlayer.username}.` });
      } else {
        client.write('text', { message: `${playerToTp} not found.` });
      }
      break;

    default:
      client.write('text', { message: `Unknown command: ${command}` });
  }
};

server.on('connect', (client) => {
  // Prevent banned players from joining
  if (banned.some(b => b.name === client.username)) {
    client.disconnect('You are banned from this server.');
    return;
  }

  console.log(`${client.username} connected!`);

  client.on('join', () => {
    console.log(`${client.username} joined the game.`);

    // Welcome message based on operator status
    if (ops.some(op => op.uuid === client.uuid)) {
      client.write('text', { message: `Welcome back, operator ${client.username}` });
    } else {
      client.write('text', { message: `Welcome, ${client.username}!` });
    }
  });

  // Handle commands
  client.on('command', (packet) => {
    const [command, ...args] = packet.command.split(' ');
    handleCommand(client, command, args);
  });

  // Inventory handling
  client.on('inventory_transaction', (transaction) => {
    console.log(`${client.username} made an inventory transaction: ${JSON.stringify(transaction)}`);
  });

  // Chat handling
  client.on('message', (packet) => {
    console.log(`${client.username} sent a message: ${packet.message}`);
  });

  // Handle disconnect
  client.on('close', () => {
    console.log(`${client.username} disconnected.`);
  });
});

// Load plugins after server starts
loadPlugins();

console.log('Server is running...');
