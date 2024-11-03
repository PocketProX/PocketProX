import { BinaryStream, WriteStream } from '@pocketprox/binarystream'

import { Identifiers } from '../../identifiers'
import { Packet } from '../../packet'

export class ConnectionRequest extends Packet {
  public clientGUID: bigint
  public timestamp: bigint

  public constructor() {
    super(Identifiers.CONNECTION_REQUEST)
  }

  public encode(stream: WriteStream): void {
    stream.writeLong(this.clientGUID)
    stream.writeLong(this.timestamp)
  }

  public decode(stream: BinaryStream): void {
    this.clientGUID = stream.readLong()
    this.timestamp = stream.readLong()
  }
}
