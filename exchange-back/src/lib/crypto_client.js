import Web3 from 'web3';
import async from 'async';
import Decimal from 'decimal.js';
import Bitcoin from 'bitcoin-core';
import Hash from './hash';
import Tx from 'ethereumjs-tx';
import keygen from './keygen';
import db from '../db';

export default class CryptoClient {
    constructor(currency) {
        this.interval = 5 * 1000;
        if (process.env.NODE_ENV === 'production') this.interval = 60 * 1000;
        this.currency = currency;
        if (!currency.hotAddress || !currency.hotSecret) this.generateHotWallet();
        this.checkInterval = null;
        this.height = currency.height || 0;
        let { host, port, username, password } = currency;
        if (!host || !port) return;
        switch (currency.short) {
            case 'BTC':
            case 'LTC':
            case 'SIB':
            case 'BIO':
                this.client = new Bitcoin({ host, port, username, password });
                break;
            case 'ETH':
            case 'ETC':
                this.client = new Web3();
                let url = `http://${this.currency.host}:${this.currency.port}`;
                this.client.setProvider(new this.client.providers.HttpProvider(url));
                break;
        }
        return this;
    }

    start() {
        if (!this.client) return;
        console.log(`starting client for ${this.currency.name}`);
        this.checkInterval = setInterval(this.update.bind(this), this.interval);
        this.update();
    }

    stop() {
        if (!this.checkInterval) return;
        clearInterval(this.checkInterval);
        this.checkInterval = null;
    }

    async updateConfirmations(diff) {
        await db.models.deposit.update({
            confirmations: db.literal(`"confirmations" +${diff}`)
        }, {
            where: { currencyId: this.currency.id, confirmed: false }
        });
        let [count, deposits] = await db.models.deposit.update({
            confirmed: true
        }, {
            returning: true,
            where: {
                currencyId: this.currency.id,
                confirmed: false,
                confirmations: { $gte: this.currency.numConf }
            }
        });
        if (!deposits.length) return;
        console.log(`${this.currency.short}: ${deposits.length} deposit(s) became mature`);
        return Promise.all(deposits.map(d => d.mature()));
    }

    async getHeight() {
        let height = null;
        switch (this.currency.short) {
            case 'BTC':
            case 'LTC':
            case 'SIB':
            case 'BIO':
                height = await this.client.getBlockCount();
                break;
            case 'ETH':
            case 'ETC':
                height = this.client.eth.blockNumber;
                break;
        }
        return height;
    }

    async moveDeposits() {
        let addresses = await db.models.address.findAll({where: {
            currencyId: this.currency.id,
            received: { $gte: 0.01 }
        }});
        await Promise.all(addresses.map(a => this.moveDeposit(a)));
    }

    async moveDeposit(address) {
        switch (this.currency.short) {
            case 'ETC':
            case 'ETH':
                await this.moveETH(address);
                break;
            case 'LTC':
            case 'BTC':
            case 'SIB':
            case 'BIO':
                await this.moveBTC(address);
                break;
        }
        await address.update({ received: 0 });
        await db.models.deposit.update({ moved: true }, { where: {
            addressId: address.id,
            confirmed: true,
            moved: false
        }});
    }

    moveETH(address) {
        return this._sendETH(address.pubkey, address.privkey, address.received, this.currency.hotAddress);
    }

    async _sendBTC(inputs, privkeys, destination, amount) {
        const inputTotal = inputs.reduce((memo, item) => memo.add(item.amount), new Decimal(0)).minus(this.networkFee);
        const outputs = { [destination]: amount };
        const change = inputTotal.minus(amount);
        if (change.lt(0)) throw new Error('amount is greater than input minus fee');
        if (change.gt(0)) outputs[this.currency.hotAddress] = change.toNumber();
        const tx = await this.client.createRawTransaction(inputs, outputs);
        const signed = await this.client.signRawTransaction(tx, inputs, privkeys);
        const hash = await this.client.sendRawTransaction(signed.hex);
        console.log(`Sent ${amount} ${this.currency.short} to ${destination}: ${hash}`);
        return hash;
    }

    async moveBTC(address) {
        const deposits = await address.depositsToMove();
        const scriptPubKey = Hash.addressScript(address.pubkey);
        const inputs = deposits.map(d => new Object({
            scriptPubKey,
            txid: d.hash,
            vout: d.vout,
            amount: d.amount,
        }));
        const amount = new Decimal(address.received).minus(this.networkFee).toNumber();
        const hash = await this._sendBTC(inputs, [address.privkey], this.currency.hotAddress, amount);
        console.log(`Moved ${address.received} ${this.currency.short} from ${address.pubkey} to hot wallet: ${hash}`);
        return hash;
    }

    async withdrawBTC(amount, destination) {
        const sendAmount = new Decimal(amount).minus(this.currency.withdrawalFee).toNumber();
        const inputs = await this.getUnspentForTX(null, sendAmount);
        const hash = await this._sendBTC(inputs, [this.currency.hotSecret], destination, sendAmount);
        console.log(`Sent ${amount} ${this.currency.short} from hot wallet to ${destination}: ${hash}`);
        return hash;
    }

    withdrawETH(amount, destination) {
        const { hotAddress, hotSecret } = this.currency;
        const sendAmount = new Decimal(amount).minus(this.currency.withdrawalFee).toNumber();
        return this._sendETH(hotAddress, hotSecret, sendAmount, destination, false);
    }

    async _sendETH(pubkey, privkey, amount, destination) {
        let gasPrice = this.client.eth.gasPrice.toNumber() || 20000000000;
        let gasLimit = '0x5208'; // 21000
        let fee = new Decimal(gasPrice).mul(gasLimit);
        let nonce = this.client.eth.getTransactionCount(pubkey);
        let sendAmount = fee.plus(this.client.toWei(amount, 'ether'));
        let txData = {
            gasLimit,
            to: destination,
            nonce: '0x' + nonce.toString(16),
            gasPrice: '0x' + gasPrice.toString(16),
            value: sendAmount.toHex()
        };
        let tx = new Tx(txData);
        tx.sign(new Buffer.from(privkey, 'hex'));
        let serialized = '0x' + tx.serialize().toString('hex');
        let hash = await new Promise((resolve, reject) => {
            this.client.eth.sendRawTransaction(serialized, (error, hash) => {
                if (error) return reject(error);
                resolve(hash);
            });
        });
        console.log(`Sent ${amount} ${this.currency.short} from ${pubkey} to ${destination}: ${hash}`);
        return hash;
    }

    async update() {
        if (!this.client) return;
        try {
            let height = await this.getHeight();
            if (!height) return;
            if (this.height == 0) this.height = height - 1;
            if (height == this.height || this.height > height) return;
            console.log(`${this.currency.short} old height: ${this.height}, new height: ${height}`);
            await this.updateConfirmations(height - this.height);
            await this.moveDeposits();
            while (this.height < height) await this.checkBlock(++this.height);
        } catch (error) {
            console.error(error);
        }
    }

    async checkEthBlock(height) {
        let block = this.client.eth.getBlock(height, true);
        console.log(`Processing ${this.currency.short} block ${height} / ${block.hash} / ${block.transactions.length} tx(s)`);
        await this.promiseLimit(block.transactions, tx => this.checkEthTransaction(tx));
        await this.currency.update({ height }, { fields: ['height'] });
    }

    async checkEthTransaction(tx) {
        console.log(`Processing ${this.currency.short} tx ${tx.hash}`);
        let address = await db.models.address.findOne({ where: { pubkey: tx.to } });
        if (!address) return;
        let deposit = await db.models.deposit.findOne({ where: { hash: tx.hash, address: tx.to } });
        if (deposit) return;
        let amount = this.client.fromWei(tx.value, 'ether').toNumber();
        deposit = await db.models.deposit.create({
            userId: address.userId,
            currencyId: address.currencyId,
            addressId: address.id,
            address: address.pubkey,
            hash: tx.hash,
            blockHash: tx.blockHash,
            blockNum: tx.blockNumber,
            amount
        });
        console.log(`Deposit ${amount} ${this.currency.short} to ${address.pubkey}`);
    }

    promiseLimit(coll, iteratee, limit = 16) {
        return new Promise((resolve, reject) => {
            const wrapperFn = async (item, callback) => {
                try {
                    await iteratee(item);
                    callback(null);
                } catch (error) {
                    callback(error);
                }
            }
            async.eachLimit(coll, limit, wrapperFn, error => error ? reject(error) : resolve());
        });
    }

    async checkBlock(height) {
        if (this.isETH) return this.checkEthBlock(height);
        let hash = await this.client.getBlockHash(height);
        let block = await this.client.getBlock(hash);
        console.log(`Processing ${this.currency.short} block ${height} / ${hash} / ${block.tx.length} tx(s)`);
        await this.promiseLimit(block.tx, tx => this.checkTransaction(block, tx, height));
        await this.currency.update({ height }, { fields: ['height'] });
    }

    async checkTransaction(block, hash, height) {
        console.log(`Processing ${this.currency.short} tx ${hash}`);
        let hex = await this.client.getRawTransaction(hash);
        let tx = await this.client.decodeRawTransaction(hex);
        let vouts = tx.vout.filter(t => t.value && t.value > 0);
        await Promise.all(vouts.map(t => this.checkRawTx(block, tx, t, height)));
    }

    async checkRawTx(block, tx, out, height) {
        if (!out.scriptPubKey.addresses || !out.scriptPubKey.addresses.length) return;
        let pubkey = out.scriptPubKey.addresses[0];
        let address = await db.models.address.findOne({ where: { pubkey } });
        if (!address) return;
        let deposit = await db.models.deposit.findOne({ where: { hash: tx.txid, address: pubkey } });
        if (deposit) return;
        deposit = await db.models.deposit.create({
            userId: address.userId,
            currencyId: address.currencyId,
            addressId: address.id,
            address: address.pubkey,
            hash: tx.txid,
            blockHash: block.hash,
            blockNum: height,
            confirmations: block.confirmations,
            amount: out.value,
            vout: out.n
        });
        console.log(`Deposit ${out.value} ${this.currency.short} to ${pubkey}`);
    }

    async generateHotWallet() {
        let { pubkey, privkey } = keygen(this.currency.short);
        await this.currency.update({ hotAddress: pubkey, hotSecret: privkey });
        if (this.isBTC && this.client) this.client.importAddress(this.currency.hotAddress);
    }

    async getUnspent() {
        let unspent = await this.client.listUnspent(1, 9999999, [this.currency.hotAddress]);
        return unspent.sort((a, b) => a.amount > b.amount);
    }

    async getUnspentAmount(unspent) {
        if (!unspent) unspent = await this.getUnspent();
        return unspent.reduce((memo, i) => memo += i.amount, 0);
    }

    async getUnspentForTX(unspent, amount) {
        if (!unspent) unspent = await this.getUnspent();
        let sum = 0;
        let result = [];
        for (let input of unspent) {
            result.push(input);
            sum += input.amount;
            if (sum >= amount + this.networkFee) break;
        }
        if (sum < amount) throw new Error('Not enough unspent in hot wallet');
        return result;
    }

    get networkFee() {
        return new Decimal(this.currency.withdrawalFee).div(2.5).toNumber();
    }

    get isBTC() {
        return ['LTC', 'BTC', 'SIB', 'BIO'].includes(this.currency.short);
    }

    get isETH() {
        return ['ETH', 'ETC'].includes(this.currency.short);
    }

    async withdraw(userId, amount, destination) {
        let hash;
        let balance = await db.models.currency.userBalance(userId, this.currency.id);
        if (new Decimal(amount).gt(balance.amount)) throw new Error('Balance is too low');
        
        if (this.isBTC) hash = await this.withdrawBTC(amount, destination);
        else if (this.isETH) hash = await this.sendETH(amount, destination);
        else throw new Error('Unknown currency type');

        db.models.balancechange.create({
            subjectId: 0, // TODO: fixme!
            subjectType: 'withdrawal',
            userId: userId,
            currencyId: this.currency.id,
            change: amount,
            total: balance.amount.minus(amount).toString()
        });
        balance.update({ amount: new Decimal(balance.amount).minus(amount).toString() });
        let body = `Произведен вывод ${amount} ${this.currency.short} на адрес ${destination}: ${hash}`;
        db.models.notification.create({ body, userId });
        return hash;
    }
}