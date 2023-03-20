if (typeof Buffer === "undefined") {
  // set the global buffer
  Buffer = require('buffer/').Buffer;
}

export interface PreviousOutput {
  lockingScript: Buffer | String;
  satoshis: number;
}

export interface PreviousOutputs extends Array<PreviousOutput> {}
