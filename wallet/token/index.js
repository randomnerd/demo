class TokenClient {
    constructor(config) {
        this.config = config;
        this.symbol = config.symbol;
        try {
            Object.assign(this, require(`./${config.type}`));
        } catch (error) {
            console.error(`Can't load extension for token ${config.type}`);
            throw error;
        }
        this.crypto = global.clients[config.proxySymbol];
        if (!this.crypto) throw new Error(`Proxy client ${config.proxySymbol} is not configured`);
        this.crypto._client.eth.accounts.wallet.add(config.manager.privkey);
        const { address, abi } = config.contract;
        this._contract = new this.crypto._client.eth.Contract(abi, address, { from: config.manager.pubkey });
    }

    async start() {
        console.log(`Starting client for ${this.symbol}`);
        return await this.startWatchers();
    }

    async stop() {
        return await this.stopWatchers();
    }
}

export default TokenClient
