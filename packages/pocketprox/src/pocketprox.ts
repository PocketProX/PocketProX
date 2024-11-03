import assert from 'assert'
import { RemoteInfo } from 'dgram'
import { EventEmitter } from 'events'
import { resolve } from 'path'
import { TaskTimer } from 'tasktimer'

import { BinaryStream } from '@pocketprox/binarystream'
import { Logger } from '@pocketprox/logger'
import { NetEvents, NetworkSession, RakServer } from '@pocketprox/raknet'

import { BlockManager } from './block/block-manager'
import { Config } from './config'
import { Encryption } from './encryption'
import { EntityPlayer } from './entity/player'
import { DataPacket } from './network/minecraft/internal/data-packet'
import { PlayerListEntry } from './network/minecraft/player-list'
import { PacketRegistry } from './network/packet-registry'
import { PlayerConnection } from './network/player-connection'
import { ResourceManager } from './resources/resource-manager'
import { GeneratorManager } from './world/generator/generator-manager'
import { World } from './world/world'

export class pocketprox extends EventEmitter {
  private static instance: pocketprox
  private server: RakServer
  private config: Required<Config>
  private connections: Map<RemoteInfo, PlayerConnection> = new Map()
  private encryption: Encryption | null = null
  private playerList: Array<PlayerListEntry> = []
  private world: World
  private ticker: TaskTimer

  public constructor(config: Required<Config>) {
    super()
    if (pocketprox.instance) {
      pocketprox.getLogger().fatal(
        'Attempted to start the server twice on a single node process.'
      )
    }

    this.config = config

    pocketprox.instance = this
    this.start()
  }

  private start(): void {
    pocketprox.getLogger().info(
      'Bootstrapping pocketprox server for Minecraft bedrock edition...'
    )

    // Allow unlimited listeners
    this.setMaxListeners(0)

    this.server = new RakServer(
      pocketprox.getConfig().server.port ?? 19132,
      pocketprox.getConfig().server.maxPlayers ?? 20,
      pocketprox.getLogger()
    )

    // Init packet registry
    PacketRegistry.init()
    ResourceManager.init()
    BlockManager.init()
    GeneratorManager.init()

    // TODO: cleanup this mess
    this.world = new World(
      pocketprox.getConfig().defaultWorld ?? 'world',
      GeneratorManager.getGenerator('flat')
    )

    // Init encryption
    if (pocketprox.getConfig().encryption != false) {
      this.encryption = new Encryption()
      pocketprox.getLogger().info(
        `Encryption is enabled, preparing server keys...`
      )
    }

    // Start the actual server
    this.server.addListener(NetEvents.GAME_PACKET, this.handleRawNetwork)
    this.server.on(NetEvents.CLOSE_SESSION, (rinfo: RemoteInfo) => {
      // We already know that connection is close, so we're safe doing it
      if (this.connections.has(rinfo)) {
        const connection = this.connections.get(rinfo)
        assert(connection != null, `Connection not found with key ${rinfo}`)
        connection.disconnect()
        this.connections.delete(rinfo)
      }
    })

    try {
      this.server.start()
      pocketprox.getLogger().info('Succesfully loaded pocketprox software!')
    } catch (err) {
      pocketprox.getLogger().fatal(err)
    }

    // Main server tick (every 1/20 seconds)
    this.ticker = new TaskTimer(50)
    this.ticker
      .add({
        callback: () => {
          // TODO: tick worlds that will tick entities and players
          for (const onlinePlayer of this.getOnlinePlayers()) {
            onlinePlayer.tick(0) // Just temp
          }
        },
      })
      .start()
  }

  /**
   * Handles the raw packet buffer
   * received from the RakNet session.
   *
   * @param stream
   * @param session
   */
  private handleRawNetwork(
    stream: BinaryStream,
    session: NetworkSession
  ): void {
    const rinfo = session.getRemoteInfo()
    if (!pocketprox.instance.connections.has(rinfo)) {
      pocketprox.instance.connections.set(rinfo, new PlayerConnection(session))
    }

    const conn = pocketprox.instance.connections.get(rinfo)!
    conn.handleWrapper(stream)
  }

  public broadcastDataPacket<T extends DataPacket>(
    packet: T,
    immediate = false
  ): void {
    for (const player of this.getOnlinePlayers()) {
      immediate
        ? player.getConnection().sendImmediateDataPacket(packet)
        : player.getConnection().sendQueuedDataPacket(packet)
    }
  }

  public getOnlinePlayers(): EntityPlayer[] {
    return Array.from(this.connections.values())
      .filter(conn => conn.isInitialized())
      .map(conn => conn.getPlayerInstance())
  }

  public getOnlinePlayer(username: string): EntityPlayer | null {
    return (
      this.getOnlinePlayers().find(
        player => player.getUsername() === username
      ) ?? null
    )
  }

  public getPlayerList(): Array<PlayerListEntry> {
    return this.playerList
  }

  public shutdown(): void {
    // Close network provider
    this.server.close()
    // Stop ticking connections
    this.ticker.stop()
    // Remove all connections
    this.connections.clear()
    pocketprox.getLogger().info('Successfully closed the server socket!')

    process.exit(0)
  }

  public static getServer(): pocketprox {
    return pocketprox.instance
  }

  public static getRakServer(): RakServer {
    return pocketprox.instance.server
  }

  public static getConfig(): Required<Config> {
    return pocketprox.instance.config
  }

  public static getLogger(): Logger {
    return pocketprox.instance.config.logger
  }

  public static getEncryption(): Encryption | null {
    return pocketprox.instance.encryption
  }

  public static getWorld(): World {
    return pocketprox.instance.world
  }
}

;(async () => {
  // node <file> <config>
  if (process.argv.length < 3) {
    console.error('Usage: node pocketprox.js <config>')
    process.exit(1)
  }

  const configPath = resolve(process.argv[2])
  let config

  try {
    // TODO: Check config correctness
    config = await import(configPath)
  } catch (err) {
    console.error('Could not load the configuration file', err)
    process.exit(1)
  }

  new pocketprox((config as any).default)
})()
