"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandardToExtended = void 0;
const BN = require("bn.js");
const helpers_1 = require("./helpers");
const StandardToExtended = function (tx, previousOuts) {
    let { returnBuffer, reader, writer } = (0, helpers_1.initReaderWriter)(tx);
    const sizeTxIns = reader.readVarintNum();
    if (sizeTxIns !== previousOuts.length) {
        throw new Error('previousOuts must be the same length as the number of inputs');
    }
    // write the Extended Format header
    writer.write(Buffer.from('0000000000EF', 'hex'));
    writer.writeVarintNum(sizeTxIns);
    for (let i = 0; i < sizeTxIns; i++) {
        // tx ID
        writer.write(reader.read(32));
        // output index
        writer.writeUInt32LE(reader.readUInt32LE());
        // input script
        const scriptBuffer = reader.readVarLengthBuffer();
        writer.writeVarintNum(scriptBuffer.length);
        writer.write(scriptBuffer);
        // sequence number
        writer.writeUInt32LE(reader.readUInt32LE());
        //
        // Write the actual extended information
        //
        writer.writeUInt64LEBN(new BN(previousOuts[i].satoshis));
        let lockingScript = previousOuts[i].lockingScript;
        if (!Buffer.isBuffer(lockingScript)) {
            lockingScript = Buffer.from(lockingScript, 'hex');
        }
        writer.writeVarintNum(lockingScript.length);
        writer.write(lockingScript);
    }
    (0, helpers_1.writeOutputs)(reader, writer);
    return returnBuffer ? writer.toBuffer() : writer.toBuffer().toString('hex');
};
exports.StandardToExtended = StandardToExtended;
//# sourceMappingURL=standard-to-extended.js.map