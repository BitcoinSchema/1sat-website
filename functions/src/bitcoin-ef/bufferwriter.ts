import * as BN from 'bn.js';

interface BufferWriter {
  new(obj?: any): BufferWriter;
  (obj?: any): BufferWriter

  varintBufNum(n: number): Buffer;
  varintBufBN(bn: BN): Buffer;

  set: (obj: any) => BufferWriter;
  toBuffer: () => Buffer;
  concat: () => Buffer;
  write: (buf: Buffer) => BufferWriter;
  writeReverse: (buf: Buffer) => BufferWriter;
  writeUInt8: (n: number) => BufferWriter;
  writeUInt16BE: (n: number) => BufferWriter;
  writeUInt16LE: (n: number) => BufferWriter;
  writeUInt32BE: (n: number) => BufferWriter;
  writeUInt32LE: (n: number) => BufferWriter;
  writeInt32LE: (n: number) => BufferWriter;
  writeUInt64BEBN: (bn: BN) => BufferWriter;
  writeUInt64LEBN: (bn: BN) => BufferWriter;
  writeVarintNum: (n: number) => BufferWriter;
  writeVarintBN: (bn: BN) => BufferWriter;

  bufLen: number;
  buffers: Buffer[];
}

const assertBuffer = function(buf: Buffer) {
  if (!Buffer.isBuffer(buf)) {
    throw new Error('not a buffer')
  }
}

const BufferWriter = <BufferWriter>function(this: BufferWriter, obj?: any): BufferWriter {
  if (!(this instanceof BufferWriter)) {
    return new BufferWriter(obj);
  }
  this.bufLen = 0;
  if (obj) {
    this.set(obj);
  } else {
    this.buffers = [];
  }

  return this;
};

BufferWriter.prototype.set = function (obj: any): BufferWriter {
  this.buffers = obj.buffers || this.buffers || [];
  this.bufLen = this.buffers.reduce(function (prev: number, buf: Buffer) {
    return prev + buf.length;
  }, 0);
  return this;
};

BufferWriter.prototype.toBuffer = function (): Buffer {
  return this.concat();
};

BufferWriter.prototype.concat = function (): Buffer {
  return Buffer.concat(this.buffers, this.bufLen);
};

BufferWriter.prototype.write = function (buf: Buffer): BufferWriter {
  assertBuffer(buf);
  this.buffers.push(buf);
  this.bufLen += buf.length;
  return this;
};

BufferWriter.prototype.writeReverse = function (buf: Buffer): BufferWriter {
  assertBuffer(buf);
  this.buffers.push(Buffer.from(buf).reverse());
  this.bufLen += buf.length;
  return this;
};

BufferWriter.prototype.writeUInt8 = function (n: number): BufferWriter {
  const buf = Buffer.alloc(1);
  buf.writeUInt8(n, 0);
  this.write(buf);
  return this;
};

BufferWriter.prototype.writeUInt16BE = function (n: number): BufferWriter {
  const buf = Buffer.alloc(2);
  buf.writeUInt16BE(n, 0);
  this.write(buf);
  return this;
};

BufferWriter.prototype.writeUInt16LE = function (n: number): BufferWriter {
  const buf = Buffer.alloc(2);
  buf.writeUInt16LE(n, 0);
  this.write(buf);
  return this;
};

BufferWriter.prototype.writeUInt32BE = function (n: number) {
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(n, 0);
  this.write(buf);
  return this;
};

BufferWriter.prototype.writeInt32LE = function (n: number) {
  const buf = Buffer.alloc(4);
  buf.writeInt32LE(n, 0);
  this.write(buf);
  return this;
};

BufferWriter.prototype.writeUInt32LE = function (n: number) {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(n, 0);
  this.write(buf);
  return this;
};

BufferWriter.prototype.writeUInt64BEBN = function (bn: BN): BufferWriter {
  const buf = bn.toBuffer('be',8);
  this.write(buf);
  return this;
};

BufferWriter.prototype.writeUInt64LEBN = function (bn: BN): BufferWriter {
  const buf = bn.toBuffer('be',8);
  this.writeReverse(buf);
  return this;
};

BufferWriter.prototype.writeVarintNum = function (n: number): BufferWriter {
  const buf = BufferWriter.varintBufNum(n);
  this.write(buf);
  return this;
};

BufferWriter.prototype.writeVarintBN = function (bn: BN): BufferWriter {
  const buf = BufferWriter.varintBufBN(bn);
  this.write(buf);
  return this;
};

BufferWriter.varintBufNum = function (n: number): Buffer {
  let buf;
  if (n < 253) {
    buf = Buffer.alloc(1);
    buf.writeUInt8(n, 0);
  } else if (n < 0x10000) {
    buf = Buffer.alloc(1 + 2);
    buf.writeUInt8(253, 0);
    buf.writeUInt16LE(n, 1);
  } else if (n < 0x100000000) {
    buf = Buffer.alloc(1 + 4);
    buf.writeUInt8(254, 0);
    buf.writeUInt32LE(n, 1);
  } else {
    buf = Buffer.alloc(1 + 8);
    buf.writeUInt8(255, 0);
    buf.writeInt32LE(n & -1, 1);
    buf.writeUInt32LE(Math.floor(n / 0x100000000), 5);
  }
  return buf;
};

BufferWriter.varintBufBN = function (bn: BN): Buffer {
  let buf;
  const n = bn.toNumber();
  if (n < 253) {
    buf = Buffer.alloc(1);
    buf.writeUInt8(n, 0);
  } else if (n < 0x10000) {
    buf = Buffer.alloc(1 + 2);
    buf.writeUInt8(253, 0);
    buf.writeUInt16LE(n, 1);
  } else if (n < 0x100000000) {
    buf = Buffer.alloc(1 + 4);
    buf.writeUInt8(254, 0);
    buf.writeUInt32LE(n, 1);
  } else {
    // @ts-ignore
    const bw = new BufferWriter();
    bw.writeUInt8(255);
    bw.writeUInt64LEBN(bn);
    buf = bw.concat();
  }
  return buf;
};

export default BufferWriter;
