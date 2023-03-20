import BufferReader from "./bufferreader";
import BufferWriter from "./bufferwriter";

export const initReaderWriter = function(tx: Buffer | String) {
  let returnBuffer = true;
  if (typeof tx === "string") {
    tx = Buffer.from(tx, 'hex');
    returnBuffer = false;
  }
  if (!Buffer.isBuffer(tx)) {
    throw new Error('buffer must be a buffer');
  }

  if (tx.length < 10) {
    throw new Error('too small to be a valid transaction');
  }

  const reader = new BufferReader(tx);
  const writer = new BufferWriter();

  // version
  writer.writeInt32LE(reader.readInt32LE());

  return { returnBuffer, reader, writer };
}

export const writeOutputs = function(reader: BufferReader, writer: BufferWriter) {
  const sizeTxOuts = reader.readVarintNum();
  writer.writeVarintNum(sizeTxOuts);
  for (let i = 0; i < sizeTxOuts; i++) {
    // satoshis
    writer.writeUInt64LEBN(reader.readUInt64LEBN());

    const size = reader.readVarintNum();
    let script = Buffer.from([]); // default
    if (size !== 0) {
      script = reader.read(size);
    }
    writer.writeVarintNum(size);
    writer.write(script);
  }

  // nLock time
  writer.writeUInt32LE(reader.readUInt32LE());
}
