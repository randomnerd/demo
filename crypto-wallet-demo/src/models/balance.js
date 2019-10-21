import mongoose from 'mongoose';
import { getAliasFromKey, loadRoot } from '../lib/hash';

export const schema = new mongoose.Schema({
    uid: {
        type: mongoose.Types.ObjectId,
        required: true,
        index: true
    },
    amount: {
        type: mongoose.Types.Decimal128,
        required: true,
        min: [0, 'No overdraft allowed'],
        default: 0
    },
    type: {
        type: String,
        index: true,
        required: true,
        default: 'default'
    },
    key: {
        type: String,
        index: true
    }
});

Object.assign(schema.methods, {
    topup(val, txid) {
        return this.model('Transaction').create({
            txid,
            target: this._id,
            type: 'topup',
            amount: mongoose.Types.Decimal128.fromString(val.toString())
        });
    },
    withdraw(val, txid) {
        return this.model('Transaction').create({
            txid,
            source: this._id,
            type: 'withdraw',
            amount: mongoose.Types.Decimal128.fromString(val.toString())
        });
    },
    transfer(val, target, txid) {
        return this.model('Transaction').create({
            txid,
            target,
            source: this._id,
            type: 'transfer',
            amount: mongoose.Types.Decimal128.fromString(val.toString())
        });
    },
    async newAlias() {
        const i = await this.model('Alias').countDocuments({ bid: this._id }).exec();
        const { key, script, redeemScript, address, xpub } = getAliasFromKey(this.key, i);
        return await this.model('Alias').create({
            i,
            key,
            script,
            redeemScript,
            address,
            uid: this.uid,
            bid: this._id,
        });
    }
});

Object.assign(schema.statics, {
    topup(_id, val, txid) {
        return new this({ _id }).topup(val, txid);
    },
    withdraw(_id, val, txid) {
        return new this({ _id }).withdraw(val, txid);
    },
    transfer(_id, val, target, txid) {
        return new this({ _id }).transfer(val, target, txid);
    }
});

schema.post('save', async function(doc) {
    try {
        const account = await doc.model('Account').findOne({ _id: doc.uid });
        console.debug(`Saved '${doc.type}' balance of ${doc.amount.toString()} for account '${account.handle}'`);
        if (doc.__v !== 0) return;
        // balance just created - add first alias
        const alias = await doc.newAlias();
        console.info(`Initializing new alias '${alias.address}' for '${account.handle}'`);
    } catch (err) {
        console.error(err);
    }
});

const Balance = mongoose.model('Balance', schema);
export default Balance;
