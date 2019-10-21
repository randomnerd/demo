import { getCurrency, getAmount, convertAmount, preparePOSResponse } from "../lib/pos";
import { Wallet, Address, Merchant, Block, Transaction } from '../models';
import _ from 'lodash';

class CryptoClient {
    constructor(config) {
        this.updating = false;
        this.config = config;
        if (!this.config) throw new Error(`Symbol ${symbol} is not found in config`);
        this.symbol = config.symbol;
        try {
            Object.assign(this, require(`./${config.type}`));
        } catch (error) {
            console.error(`Can't load extension for crypto ${config.type}`);
            throw error;
        }
    }

    async start() {
        console.log(`Starting client for ${this.symbol}`);
        try {
            await this.initClient();
            this.updateTimer = setInterval(this.update.bind(this), this.config.interval);
            return await this.update();
        } catch (error) {
            throw error;
        }
    }

    stop() {
        if (!this.updateTimer) return;
        clearInterval(this.updateTimer);
    }

    async getLastHeight(height) {
        return (await Block.getHeight(this.symbol)) || height - 1;
    }

    async update() {
        if (this.updating) return console.log(`${this.symbol} prev update not finished yet, skipping`);
        try {
            this.updating = true;
            const lastBlock = await Block.findOne({where: { symbol: this.symbol }, order: [['height', 'DESC']]});
            if (lastBlock && lastBlock.createdAt < +new Date() - (this.config.blockTime * 3)) {
                HookLog.noBlocks(this.symbol, lastBlock);
            }
            const height = await this.getHeight();
            let lastHeight = await this.getLastHeight(height);
            if (height === 0 || height === lastHeight || lastHeight > height) return;
            console.log(`${this.symbol} old height: ${lastHeight}, new: ${height}`);
            await this.updateConfirmations(height);
            await this.moveDeposits();
            while (height > lastHeight) await this.processBlock(++lastHeight);
        } catch (error) {
            console.error(error);
        } finally {
            this.updating = false;
        }
    }

    async updateConfirmations(height) {
        await Transaction.update({
            nconf: Transaction.sequelize.literal(`${height} - "blk" + 1`)
        }, {
            where: { symbol: this.symbol, conf: false }
        });
        let [count, txs] = await Transaction.update({
            conf: true
        }, {
            returning: true,
            where: {
                symbol: this.symbol,
                conf: false,
                nconf: { $gte: this.config.numConf }
            }
        });
        if (count === 0) return;
        console.log(`${this.symbol}: ${count} deposit(s) became mature`);
        return Promise.all(txs.map(tx => tx.makeMature()));
    }

    async moveDeposit(tx) {
        try {
            const { pubkey, privkey } = await Address.findById(tx.aid);
            await this._send(pubkey, privkey, tx.value, this.config.hotWallet.pubkey);
            return Transaction.update({ moved: true }, { where: { aid: tx.aid, moved: false, mature: true } });
        } catch (error) {
            console.error(error);
        }
    }

    async moveDeposits() {
        const txs = await Transaction.findAll({
            attributes: ['aid', [Transaction.sequelize.literal('sum("value")'), 'value']],
            where: { symbol: this.symbol, mature: true, moved: false },
            group: 'aid'
        });
        return Promise.all(txs.map(t => this.moveDeposit(t)));
    }

    async withdraw(uid, destination, value) {
        if (!value || value <= 0) throw new Error('Wrong value');
        if (!destination) throw new Error('Missing address');
        if (!await this.validateAddress(destination)) throw new Error('Invalid address');
        const wallet = await Wallet.findOne({ where: { uid, symbol: this.symbol } });
        if (!wallet) throw new Error('Wallet not found');
        if (wallet.balance < value) throw new Error('Not enough funds');
        const { pubkey, privkey } = this.config.hotWallet;
        const hash = await this._send(pubkey, privkey, value, destination, false);
        const balance = await wallet.take(value, { hash, address: destination, op: 'withdraw' });
        return { hash, balance };
    }

    async posPayment(uid, pos) {
        const posReply = preparePOSResponse(pos);
        try {
            const curr = getCurrency(pos);
            const amount = getAmount(pos);
            console.log(`payment: ${amount} of ${curr}`);
            if (!amount || amount <= 0) throw new Error('12');

            const wallet = await Wallet.getByUid(uid, this.symbol);
            const cryptoAmount = convertAmount(curr, wallet.symbol, amount);
            console.log(`crypto amount: ${cryptoAmount}`);
            if (wallet.balance < cryptoAmount) throw new Error('51');
            const merchant = await Merchant.getByCode(pos['41']);
            if (!merchant) throw new Error('12');
            const destination = _.find(merchant.wallets, { symbol: this.symbol }).address;
            if (!destination) throw new Error('12');
            console.log(`send ${cryptoAmount} ${this.symbol} to ${destination}`);
            const { pubkey, privkey } = this.config.hotWallet;
            const hash = await this._send(pubkey, privkey, cryptoAmount, destination, false);
            await wallet.take(cryptoAmount, { pos, hash, address: destination, op: 'payment' });
            posReply['39'] = '00';
            posReply['63'] = hash;
            return posReply;
        } catch(e) {
            console.error(e);
            posReply['39'] = e.message;
            return posReply;
        }
    }
}

export default CryptoClient
