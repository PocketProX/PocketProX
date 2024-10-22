const fs = require('fs');
const path = require('path');

function handlePlayerCommands(client) {
  client.on('text', ({ message }) => {
    const args = message.split(' ');
    const command = args.shift().toLowerCase();

    switch (command) {
      case '/op':
        if (args[0]) {
          addOp(client, args[0]);
        } else {
          client.write('text', { message: 'Usage: /op <playerName>' });
        }
        break;
      case '/deop':
        if (args[0]) {
          removeOp(client, args[0]);
        } else {
          client.write('text', { message: 'Usage: /deop <playerName>' });
        }
        break;
      case '/ban':
        if (args[0]) {
          banPlayer(client, args[0]);
        } else {
          client.write('text', { message: 'Usage: /ban <playerName>' });
        }
        break;
      case '/kick':
        if (args[0]) {
          kickPlayer(client, args[0]);
        } else {
          client.write('text', { message: 'Usage: /kick <playerName>' });
        }
        break;
      default:
        client.write('text', { message: `Unknown command: ${command}` });
        break;
    }
  });
}

function addOp(client, playerName) {
  const ops = JSON.parse(fs.readFileSync(path.join(__dirname, '../ops.json'), 'utf-8'));
  if (ops.find(op => op.name === playerName)) {
    client.write('text', { message: `${playerName} is already an operator.` });
    return;
  }
  ops.push({ uuid: client.profile.uuid, name: playerName });
  fs.writeFileSync(path.join(__dirname, '../ops.json'), JSON.stringify(ops, null, 2));
  client.write('text', { message: `${playerName} is now an operator.` });
}

function removeOp(client, playerName) {
  let ops = JSON.parse(fs.readFileSync(path.join(__dirname, '../ops.json'), 'utf-8'));
  ops = ops.filter(op => op.name !== playerName);
  fs.writeFileSync(path.join(__dirname, '../ops.json'), JSON.stringify(ops, null, 2));
  client.write('text', { message: `${playerName} is no longer an operator.` });
}

function banPlayer(client, playerName) {
  const bannedPlayers = JSON.parse(fs.readFileSync(path.join(__dirname, '../banned.json'), 'utf-8'));
  bannedPlayers.push({ uuid: client.profile.uuid, name: playerName });
  fs.writeFileSync(path.join(__dirname, '../banned.json'), JSON.stringify(bannedPlayers, null, 2));
  client.write('text', { message: `${playerName} has been banned.` });
}

function kickPlayer(client, playerName) {
  // Kick logic (Assume playerName is in the game)
  client.write('text', { message: `${playerName} has been kicked from the server.` });
}

module.exports = { handlePlayerCommands };
