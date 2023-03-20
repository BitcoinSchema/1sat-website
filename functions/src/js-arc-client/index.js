"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArcClient = void 0;
const cross_fetch_1 = require("cross-fetch");
global.fetch = cross_fetch_1.default;
class ArcClient {
    constructor(serverUrl, options) {
        this.version = "v1";
        if (!serverUrl) {
            throw new Error("serverUrl is required");
        }
        this.client = (options || {});
        if (options === null || options === void 0 ? void 0 : options.version) {
            this.version = options.version;
        }
        this.client.serverUrl = serverUrl.replace(/\/$/, "");
    }
    /**
     * Set the API key
     * Header:
     * - X-API-KEY: <apiKey>
     *
     * @param apiKey: string API key to use for authentication
     */
    setApiKey(apiKey) {
        this.client.apiKey = apiKey;
    }
    /**
     * Set the Bearer token
     * Header:
     * - Authorization: Bearer <bearer>
     *
     * @param bearer: string Bearer token to use for authentication
     */
    setBearer(bearer) {
        this.client.bearer = bearer;
    }
    /**
     * Set the Authorization header
     * Header:
     * - Authorization: <authorization>
     *
     * @param authorization: string Raw authorization header to use for authentication
     */
    setAuthorization(authorization) {
        this.client.authorization = authorization;
    }
    /**
     * Set the debug flag
     */
    setDebug(debug) {
        this.client.debug = debug;
    }
    /**
     * Get the fee policy of the arc server
     *
     * @returns {Promise<Policy>}
     */
    getPolicy() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.doHTTPRequest(`${this.client.serverUrl}/${this.version}/policy`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        });
    }
    /**
     * Get the transaction status for a transaction
     *
     * @param txId string Transaction ID
     * @returns {Promise<TransactionStatus | TransactionError>}
     */
    getTransactionStatus(txId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!txId) {
                throw new Error("txId is required");
            }
            if (!/^[0-9A-Fa-f]+$/.test(txId)) {
                throw new Error("txId must be a valid hex string");
            }
            if (txId.length !== 64) {
                throw new Error("txId must be 64 characters long");
            }
            return yield this.doHTTPRequest(`${this.client.serverUrl}/${this.version}/tx/${txId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        });
    }
    /**
     * Post a transaction to the ARC server
     *
     * This functions accepts the transaction either as a hex string or a Buffer
     * If the transaction is a Buffer, it will be sent to the ARC server as a
     * binary (application/octet-stream) request
     *
     * @param tx string | Buffer Transaction to post
     * @returns {Promise<TransactionStatus | TransactionError>}
     */
    postTransaction(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!tx) {
                throw new Error("tx is required");
            }
            if (typeof tx === "string" && !/^[0-9A-Fa-f]+$/.test(tx)) {
                throw new Error("tx must be a valid hex string");
            }
            let contentType = "text/plain";
            if (tx instanceof Buffer) {
                contentType = "application/octet-stream";
            }
            return yield this.doHTTPRequest(`${this.client.serverUrl}/${this.version}/tx`, {
                method: 'POST',
                headers: {
                    "Content-Type": contentType,
                },
                body: tx,
            });
        });
    }
    /**
     * Post transactions in a batch to the ARC server
     *
     * This functions accepts the transactions either as an array of hex strings or a Buffer
     * If the transactions are in a Buffer, they will be sent to the ARC server as a
     * binary (application/octet-stream) request, which will be processed as a stream on the ARC server
     *
     * @param txs string[] | Buffer Transactions to post
     * @returns {Promise<TransactionStatus | TransactionError>}
     */
    postTransactions(txs) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!txs) {
                throw new Error("txs cannot be empty");
            }
            if (txs.length === 0) {
                throw new Error("txs must contain at least one transaction");
            }
            let contentType = "application/json";
            let body;
            if (txs instanceof Buffer) {
                contentType = "application/octet-stream";
                body = txs;
            }
            else {
                if (!Array.isArray(txs)) {
                    throw new Error("txs must be an array of hex strings or a Buffer");
                }
                txs.forEach((tx) => {
                    if (!/^[0-9A-Fa-f]+$/.test(tx)) {
                        throw new Error("tx must be a valid hex string");
                    }
                });
                body = JSON.stringify(txs);
            }
            return yield this.doHTTPRequest(`${this.client.serverUrl}/${this.version}/txs`, {
                method: 'POST',
                headers: {
                    "Content-Type": contentType,
                },
                body,
            });
        });
    }
    doHTTPRequest(url, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let headers = Object.assign({}, options.headers);
            headers['Accept'] = 'application/json';
            if (this.client.apiKey) {
                headers["X-API-KEY"] = this.client.apiKey;
            }
            if (this.client.bearer) {
                headers["Authorization"] = `Bearer ${this.client.bearer}`;
            }
            if (this.client.authorization) {
                headers["Authorization"] = this.client.authorization;
            }
            const httpOptions = Object.assign(Object.assign({}, options), { headers });
            const response = yield global.fetch(url, httpOptions);
            if (response.status >= 400) {
                this.lastError = (yield response.json());
                throw new Error(response.statusText);
            }
            return response.json();
        });
    }
}
exports.ArcClient = ArcClient;
//# sourceMappingURL=index.js.map