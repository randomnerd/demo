import mongoose from 'mongoose';
import { newRoot } from '../lib/hash';
export const schema = new mongoose.Schema({
    handle: {
        type: String,
        unique: true,
        required: true
    }
});

Object.assign(schema.methods, {
    getBalance(type = 'default') {
        return this.model('Balance').findOne({ uid: this._id, type });
    },
    async getBalanceAmount(type = 'default') {
        const balance = await this.getBalance(type);
        if (balance === null) return mongoose.Types.Decimal128.fromString('0');
        return balance.amount;
    },
    getBalances(cb) {
        return this.model('Balance').find({ uid: this._id }, cb);
    }
});

schema.post('save', async function(doc) {
    if (doc.__v !== 0) return;
    // account just created, add empty balance of type 'default'
    console.info(`Initializing new account '${doc.handle}' with zero 'default' balance`);
    const root = newRoot();
    await doc.model('Balance').create({
        uid: doc._id,
        amount: 0,
        type: 'default',
        key: root.toBase58()
    });
});

const Account = mongoose.model('Account', schema);
export default Account;
