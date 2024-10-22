module.exports = (server) => {
  server.on('login', (client) => {
    client.write('text', { message: `Welcome to the server, ${client.profile.name}!` });
  });
};	

