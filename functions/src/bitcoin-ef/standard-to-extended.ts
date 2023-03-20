import * as BN from "bn.js";
import { PreviousOutputs } from "./interface";
import { initReaderWriter, writeOutputs } from "./helpers";


export const StandardToExtended = function(tx: Buffer | string, previousOuts: PreviousOutputs): Buffer | string {
  let { returnBuffer, reader, writer } = initReaderWriter(tx);

  const sizeTxIns = reader.readVarintNum();
  if (sizeTxIns !== previousOuts.length) {
    throw new Error('previousOuts must be the same length as the number of inputs')
  }

  // write the Extended Format header
  writer.write(Buffer.from('0000000000EF', 'hex'))
  writer.writeVarintNum(sizeTxIns);

  for (let i = 0; i < sizeTxIns; i++) {
    // tx ID
    writer.write(reader.read(32));
    // output index
    writer.writeUInt32LE(reader.readUInt32LE());

    // input script
    const scriptBuffer = reader.readVarLengthBuffer();
    writer.writeVarintNum(scriptBuffer.length)
    writer.write(scriptBuffer);

    // sequence number
    writer.writeUInt32LE(reader.readUInt32LE());

    //
    // Write the actual extended information
    //
    writer.writeUInt64LEBN(new BN(previousOuts[i].satoshis))

    let lockingScript = previousOuts[i].lockingScript;
    if (!Buffer.isBuffer(lockingScript)) {
      lockingScript = Buffer.from(lockingScript as string, 'hex');
    }
    writer.writeVarintNum(lockingScript.length)
    writer.write(lockingScript as Buffer)
  }

  writeOutputs(reader, writer);

  return returnBuffer ? writer.toBuffer() : writer.toBuffer().toString('hex');
}
