"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeOutputs = exports.initReaderWriter = void 0;
const bufferreader_1 = require("./bufferreader");
const bufferwriter_1 = require("./bufferwriter");
const initReaderWriter = function (tx) {
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
    const reader = new bufferreader_1.default(tx);
    const writer = new bufferwriter_1.default();
    // version
    writer.writeInt32LE(reader.readInt32LE());
    return { returnBuffer, reader, writer };
};
exports.initReaderWriter = initReaderWriter;
const writeOutputs = function (reader, writer) {
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
};
exports.writeOutputs = writeOutputs;
//# sourceMappingURL=helpers.js.map