import { removeNullKeys } from "@/lib/utils";
import {
  changeAddressPath,
  identityAddressPath,
  identityPk,
  mnemonic,
  ordAddressPath,
  ordPk,
  payPk,
} from "@/signals/wallet";

export const getBalanceText = (balance: number, numDecimals: number) => {
  return balance > 1000000000
    ? `${(balance / 1000000000).toFixed(2)}B`
    : balance > 1000000
      ? `${(balance / 1000000).toFixed(2)}M`
      : numDecimals > 0
        ? balance.toFixed(2)
        : balance.toString();
};

export const backupKeys = () => {
  let payPkDerivationPath = changeAddressPath.value;
  let ordPkDerivationPath = ordAddressPath.value;

  if (typeof changeAddressPath.value === "number") {
    payPkDerivationPath = `m/${changeAddressPath.value}`;
  }

  if (typeof ordAddressPath.value === "number") {
    ordPkDerivationPath = `m/${ordAddressPath.value}`;
  }

  const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(
      removeNullKeys({
        mnemonic: mnemonic.value,
        payPk: payPk.value,
        payDerivationPath: payPkDerivationPath,
        ordPk: ordPk.value,
        ordDerivationPath: ordPkDerivationPath,
        identityPk: identityPk.value,
        identityDerivationPath: identityAddressPath.value,
      }),
    ),
  )}`;

  const clicker = document.createElement("a");
  clicker.setAttribute("href", dataStr);
  clicker.setAttribute("download", "1sat.json");
  clicker.click();
};

export const swapKeys = () => {
  // swaps paypk with ordpk values
  const tempPayPk = payPk.value;
  const tempOrdPk = ordPk.value;
  if (!tempPayPk || !tempOrdPk) {
    return;
  }
  ordPk.value = tempPayPk;
  payPk.value = tempOrdPk;
};

export const exportKeysViaFragment = () => {
  // redirect to https://1sat.market/wallet/import#import=<b64KeyBackupData>
  const fk = localStorage.getItem("1satfk");
  const ok = localStorage.getItem("1satok");
  let data = "";
  if (!fk || !ok) {
    data = JSON.stringify({ payPk: payPk.value, ordPk: ordPk.value });
  } else {
    data = JSON.stringify({ payPk: JSON.parse(fk), ordPk: JSON.parse(ok) });
  }
  const _b64 = btoa(data);
  const _base = "http://localhost:3000"; // "https://1sat.market"
  // window.location.href = `${base}/wallet/import#import=${b64}`;
};
