"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeFeeType = exports.TxStatus = void 0;
var TxStatus;
(function (TxStatus) {
    TxStatus["ANNOUNCED_TO_NETWORK"] = "ANNOUNCED_TO_NETWORK";
    TxStatus["CONFIRMED"] = "CONFIRMED";
    TxStatus["MINED"] = "MINED";
    TxStatus["RECEIVED"] = "RECEIVED";
    TxStatus["REJECTED"] = "REJECTED";
    TxStatus["SEEN_ON_NETWORK"] = "SEEN_ON_NETWORK";
    TxStatus["SENT_TO_NETWORK"] = "SENT_TO_NETWORK";
    TxStatus["STORED"] = "STORED";
    TxStatus["UNKNOWN"] = "UNKNOWN";
})(TxStatus = exports.TxStatus || (exports.TxStatus = {}));
var FeeFeeType;
(function (FeeFeeType) {
    FeeFeeType["FeeTypeStandard"] = "standard";
    FeeFeeType["FeeTypeData"] = "data";
})(FeeFeeType = exports.FeeFeeType || (exports.FeeFeeType = {}));
//# sourceMappingURL=interface.js.map