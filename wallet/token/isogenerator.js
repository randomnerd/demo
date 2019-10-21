import TokenClient from './';

module.exports = {
    async startWatchers() {
        const fromBlock = await this.crypto.getLastHeight();
        const watchers = this._watchers = [];
        watchers.push(this._contract.events.TokenAdded({ fromBlock }, this.onAddToken.bind(this)));
        const tokens = await this._contract.methods.getTokens().call();
        for (let token of tokens) this.addToken(token);
    },

    async stopWatchers() {
    },

    onAddToken(error, event) {
        if (error) throw error;
        return this.addToken(event.returnValues.iso);
    },

    async addToken(address) {
        try {
            const abi = this.config.contract.isoAbi;
            const { manager, proxySymbol } = this.config;
            const tokenContract = new this.crypto._client.eth.Contract(abi, address, { from: manager.pubkey });
            const symbol = (await tokenContract.methods.symbol().call()).toLowerCase();
            const tokenConfig = {
                symbol,
                manager,
                proxySymbol,
                type: 'iso',
                contract: { abi, address }
            };
            if (global.tokens[symbol]) throw new Error(`token ${symbol} already present`);
            const token = global.tokens[symbol] = new TokenClient(tokenConfig);
            console.log(`token added: ${symbol} @ ${address}`);
            token.start();
        } catch (error) {
            console.error(error);
        }
    }
};
