import { Address, Transaction, Wallet } from '../models';

module.exports = {
    async startWatchers() {
        const fromBlock = await this.crypto.getLastHeight();
        const watchers = this._watchers = [];
        watchers.push(this._contract.events.Buy({ fromBlock }, this.processBuy.bind(this)));
        watchers.push(this._contract.events.BuyWithId({ fromBlock }, this.processBuyWithId.bind(this)));
    },

    async stopWatchers() {
    },

    async processBuy(error, event) {
        try {
            if (error) throw new Error(error);
            if (!event.returnValues) throw new Error('Got event with no values');
            const { buyer, amount } = event.returnValues;
            const address = await Address.findOne({
                where: {
                    symbol: this.config.proxySymbol,
                    pubkey: buyer.toLowerCase()
                }
            });
            if (!address) return;
            const value = this.crypto._client.utils.fromWei(amount, 'ether');
            let tx = await Transaction.findOne({
                where: {
                    symbol: this.symbol,
                    hash: event.transactionHash,
                    address: address.pubkey
                }
            });
            if (tx) return;
            tx = await Transaction.create({
                value,
                conf: true,
                idx: event.transactionIndex,
                hash: event.transactionHash,
                uid: address.uid,
                wid: address.wid,
                aid: address.id,
                symbol: this.symbol,
                address: address.pubkey,
                blkHash: event.blockHash,
                blk: event.blockNumber
            });
            await tx.makeMature();
            console.log(`Deposit ${value} ${this.symbol} to ${address.pubkey}`);
        } catch(e) {
            console.error(e);
            throw e;
        }
    },

    async processBuyWithId(error, event) {
        try {
            if (error) throw new Error(error);
            if (!event.returnValues) throw new Error('Got event with no values');
            const { investorId, amount } = event.returnValues;
            const wallet = await Wallet.getByUid(investorId, this.symbol);
            const proxyWallet = await Wallet.getByUid(investorId, this.config.proxySymbol);
            const address = await Address.getForWallet(proxyWallet.id);
            let tx = await Transaction.findOne({
                where: {
                    symbol: this.symbol,
                    hash: event.transactionHash,
                    address: address.pubkey
                }
            });
            if (tx) return;
            tx = await Transaction.create({
                idx: event.transactionIndex,
                value: amount,
                hash: event.transactionHash,
                uid: investorId,
                wid: wallet.id,
                aid: address.id,
                symbol: this.symbol,
                address: address.pubkey,
                blkHash: event.blockHash,
                blk: event.blockNumber
            });
            await tx.makeMature();
            console.log(`Deposit ${amount} ${this.symbol} to ${address.pubkey}`);
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
};
