const fs = require('fs');
const path = require('path');

function handleInventory(client) {
  const playerDataPath = path.join(__dirname, '../player_data', `${client.profile.uuid}.json`);
  
  if (!fs.existsSync(playerDataPath)) {
    const initialData = {
      uuid: client.profile.uuid,
      name: client.profile.name,
      inventory: [],
      position: { x: 0, y: 64, z: 0 }
    };
    fs.writeFileSync(playerDataPath, JSON.stringify(initialData, null, 2));
  }

  client.on('inventoryTransaction', (packet) => {
    const playerData = JSON.parse(fs.readFileSync(playerDataPath, 'utf-8'));
    if (packet.transactionType === 'normal') {
      playerData.inventory.push({
        itemId: packet.itemId,
        itemCount: packet.count
      });
      fs.writeFileSync(playerDataPath, JSON.stringify(playerData, null, 2));
      client.write('text', { message: `Item ${packet.itemId} added to inventory.` });
    }
  });
}

module.exports = { handleInventory };
