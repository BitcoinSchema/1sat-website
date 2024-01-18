
export const ORDFS = `https://ordfs.network`;
export const API_HOST = `https://ordinals.gorillapool.io`;

export const enum SortBy {
  PC = "pct_minted",
  Available = "available",
  Tick = "tick",
  Max = "max",
  Height = "height",
}

export const enum Dir {
  ASC = "asc",
  DESC = "desc",
}

export enum Bsv20Status {
  Invalid = -1,
  Pending = 0,
  Valid = 1,
}

export const toastProps = {
  style: {
    background: "#333",
    color: "#fff",
  },
  iconTheme: {
    primary: "#111",
    secondary: "#0fffc3",
  },
};

export enum FetchStatus {
  Idle,
  Loading,
  Success,
  Error,
}

export enum AssetType {
  Ordinals="ordinals",
  BSV20="bsv20",
  BSV20V2="bsv20v2",
  LRC20="lrc20",
}

// Constants
export const marketAddress = `15q8YQSqUa9uTh6gh4AVixxq29xkpBBP9z`;
export const minimumMarketFee = 10000;
export const marketRate = 0.04;
export const P2PKHInputSize = 148;


export const resultsPerPage = 60;