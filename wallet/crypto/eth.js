import Web3 from 'web3';
import BN from 'bignumber.js';
import { promiseLimit } from '../lib/util';
import { Block, Transaction, Address } from '../models';

module.exports = {
    initClient() {
        this._client = new Web3(`${this.config.connection || 'http'}://${this.config.host}:${this.config.port || 8545}`);
    },

    getHeight() {
        return this._client.eth.getBlockNumber();
    },

    async _send(pubkey, privkey, amount, destination, includeFee = true) {
        const gasPrice = await this._client.eth.getGasPrice();
        const gasLimit = 21000;
        const nonce = await this._client.eth.getTransactionCount(pubkey);
        const weiAmount = this._client.utils.toWei(amount.toString(), 'ether');
        const value = includeFee ? new BN(weiAmount).minus(new BN(gasLimit).multipliedBy(gasPrice)) : weiAmount;
        const txData = {
            nonce: `0x${nonce.toString(16)}`,
            value,
            gasLimit,
            gasPrice: `0x${parseInt(gasPrice).toString(16)}`,
            to: destination
        };
        const account = this._client.eth.accounts.privateKeyToAccount(privkey);
        const tx = await account.signTransaction(txData);
        this._client.eth.sendSignedTransaction(tx.rawTransaction);
        const hash = await new Promise((resolve, reject) => {
            this._client.eth.sendSignedTransaction(tx.rawTransaction)
                .once('transactionHash', resolve)
                // .catch(reject);
        })
        console.log(`Sent ${amount} ${this.symbol} from ${pubkey} to ${destination}: ${hash}`);
        return hash;
    },

    async processBlock(height) {
        let block = await this._client.eth.getBlock(height, true);
        console.log(`Processing ${this.symbol} block ${height} / ${block.hash} / ${block.transactions.length} tx(s)`);
        await promiseLimit(block.transactions, (tx, idx) => this.processTransaction(tx, idx));
        await Block.create({ height, hash: block.hash, symbol: this.symbol });
    },

    async processTransaction(txData, idx) {
        try {
            if (!txData.to) return;
            // console.log(`Processing ${this.symbol} tx ${txData.hash} @ ${txData.to.toLowerCase()}`);
            const address = await Address.findOne({ where: { symbol: this.symbol, pubkey: txData.to.toLowerCase() } });
            if (!address) return;
            const tx = await Transaction.findOne({
                where: {
                    symbol: this.symbol,
                    hash: txData.hash,
                    address: txData.to.toLowerCase()
                }
            });
            if (tx) return;
            const value = this._client.utils.fromWei(txData.value, 'ether');
            await Transaction.create({
                idx,
                value,
                hash: txData.hash,
                uid: address.uid,
                wid: address.wid,
                aid: address.id,
                symbol: this.symbol,
                address: address.pubkey,
                blkHash: txData.blockHash,
                blk: txData.blockNumber,
                source: txData.from
            });
            console.log(`Deposit ${value} ${this.symbol} to ${address.pubkey}`);
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    validateAddress(address) {
        return this._client.utils.isAddress(address);
    }
};
