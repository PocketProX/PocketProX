import { DevLogger, MainLogger } from '@pocketprox/logger'

export default {
  defaultWorld: 'world',
  logger: new MainLogger(/*{ saveToFile: false }*/),
  lang: 'en_US',
  filesystem: null, // Can optionally be in memory
  plugins: [],
  encryption: false,
  server: {
    port: 19132,
    motd: 'A pocketprox minecraft bedrock server',
    maxPlayers: 20,
  },
}
