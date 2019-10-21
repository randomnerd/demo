import BN from 'bignumber.js';
import Bitcoin from 'bitcoin-core';
import { promiseLimit } from '../lib/util';
import Hash from '../lib/hash';
import { Block, Transaction, Address } from '../models';

module.exports = {
    async initClient() {
        let { host, port, username, password } = this.config;
        this._client = new Bitcoin({ host, port, username, password });
        const watchList = await this._client.getAddressesByAccount('');
        const { pubkey } = this.config.hotWallet;
        if (!watchList.includes(pubkey)) await this._client.importAddress(pubkey);
    },

    getHeight() {
        return this._client.getBlockCount();
    },

    async _send(pubkey, privkey, amount, destination, includeFee = true) {
        let inputs;
        if (pubkey === this.config.hotWallet.pubkey) {
            inputs = await this.getUnspentForTX(amount);
        } else {
            const address = await Address.findOne({ where: { pubkey, symbol: this.symbol } });
            const scriptPubKey = Hash.addressScript(address.pubkey);
            const unspent = await Transaction.findAll({
                where: {
                    symbol: this.symbol,
                    moved: false,
                    address: pubkey
                }
            });
            inputs = unspent.map(tx => ({
                scriptPubKey,
                txid: tx.hash,
                vout: tx.idx,
                amount: tx.value
            }));
        }
        const sendAmount = includeFee ? new BN(amount).minus(this.config.networkFee).toNumber() : amount;
        const inputTotal = inputs.reduce((memo, item) => memo.plus(item.amount), new BN(0));
        const outputs = { [destination]: sendAmount };
        const change = includeFee ? inputTotal.minus(amount) : inputTotal.minus(amount + this.config.networkFee);
        // console.log(`amount: ${amount}, inputs: ${inputTotal}, sendAmount: ${sendAmount}, change: ${change}`);
        if (change.lt(0)) throw new Error('amount is greater than input minus fee');
        if (change.gt(0)) outputs[this.config.hotWallet.pubkey] = change.toNumber();
        const tx = await this._client.createRawTransaction(inputs, outputs);
        const signed = await this._client.signRawTransaction(tx, inputs, [privkey]);
        const hash = await this._client.sendRawTransaction(signed.hex);
        console.log(`Sent ${amount} ${this.symbol} to ${destination}: ${hash}`);
        return hash;
    },

    async processBlock(height) {
        try {
            const hash = await this._client.getBlockHash(height);
            const block = await this._client.getBlock(hash);
            console.log(`Processing ${this.symbol} block ${height} / ${hash} / ${block.tx.length} tx(s)`);
            await promiseLimit(block.tx, tx => this.processTransaction(block, tx, height));
            await Block.create({ height, hash: hash, symbol: this.symbol });
        } catch (error) {
            console.error(error);
            throw error;
        }

    },

    async processTransaction(block, hash, height) {
        try {
            // console.log(`Processing ${this.symbol} tx ${hash}`);
            const hex = await this._client.getRawTransaction(hash);
            const tx = await this._client.decodeRawTransaction(hex);
            const vouts = tx.vout.filter(t => t.value && t.value > 0);
            await Promise.all(vouts.map(t => this.checkRawTx(block, tx, t, height)));
        } catch (error) {
            console.log(error);
            throw error;
        }

    },

    async checkRawTx(block, rawtx, out, height) {
        if (!out.scriptPubKey.addresses || !out.scriptPubKey.addresses.length) return;
        const pubkey = out.scriptPubKey.addresses[0];
        const address = await Address.findOne({ where: { pubkey, symbol: this.symbol } });
        if (!address) return;
        const tx = await Transaction.findOne({
            where: {
                symbol: this.symbol,
                hash: rawtx.txid,
                address: pubkey
            }
        });
        if (tx) return;
        await Transaction.create({
            idx: out.n,
            value: out.value,
            hash: rawtx.txid,
            uid: address.uid,
            wid: address.wid,
            aid: address.id,
            symbol: this.symbol,
            address: address.pubkey,
            blkHash: block.hash,
            blk: height
        });
        console.log(`Deposit ${out.value} ${this.symbol} to ${address.pubkey}`);
    },

    async getUnspent() {
        let unspent = await this._client.listUnspent(1, 9999999, [this.config.hotWallet.pubkey]);
        return unspent.sort((a, b) => a.amount > b.amount);
    },

    async getUnspentForTX(amount, unspent) {
        if (!unspent) unspent = await this.getUnspent();
        let sum = 0;
        let result = [];
        for (let input of unspent) {
            result.push(input);
            sum += input.amount;
            if (sum >= amount + this.config.networkFee) break;
        }
        if (sum < amount) throw new Error(`Not enough unspent in hot wallet, requested ${amount}, found ${sum}`);
        return result;
    },

    async validateAddress(address) {
        const result = await this._client.validateAddress(address);
        return result.isvalid;
    }
};
