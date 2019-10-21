import mongoose from 'mongoose';

export const schema = new mongoose.Schema({
    source: {
        type: mongoose.Types.ObjectId,
        index: true,
        required() { return this.type === 'withdraw' || this.type === 'transfer' },
        validate: {
            async validator(v) {
                if (this.type === 'topup' && !v) return true;
                const balance = await this.model('Balance').findOne({
                    _id: v,
                    amount: { $gte: this.amount }
                });
                return !!balance;
            },
            message: 'Not enough balance'
        }
    },
    target: {
        type: mongoose.Types.ObjectId,
        index: true,
        required() { return this.type === 'topup' || this.type === 'transfer' },
        validate: {
            async validator(v) {
                if (this.type === 'withdraw' && !v) return true;
                const Balance = this.model('Balance');
                const [source, target] = await Promise.all([
                    Balance.findOne({ _id: this.source }),
                    Balance.findOne({ _id: v })
                ]);
                if (this.type === 'transfer') {
                    if (!source || !target) return false;
                    return source.type === target.type;
                }
                return true;
            },
            message: 'Wrong target'
        }
    },
    amount: {
        type: mongoose.Types.Decimal128,
        required: true,
        min: [ 0.01, 'Minimal tx amount allowed is 0.01' ],
    },
    type: {
        type: String,
        index: true,
        required: true,
        validate: {
            validator(v) {
                if (this.source && this.target && v !== 'transfer') return false;
                switch (v) {
                    case 'transfer':
                    case 'topup':
                    case 'withdraw':
                        return true;
                    default:
                        return false;
                }
            },
            message: props => `${props.value} is not a valid type for this transaction`
        }
    },
    status: {
        type: String,
        index: true,
        default: 'pending',
        validate: {
            validator(v) {
                switch (v) {
                    case 'pending':
                    case 'assigned':
                    case 'invalid':
                    case 'error':
                    case 'done':
                        return true;
                    default:
                        return false;
                }
            }
        }
    },
    workerId: {
        type: String,
        index: true,
        default: null,
        required() { return this.status !== 'pending' }
    },
    log: String,
    txid: {
        type: String,
        default: null
    },
    height: Number,
    conf: {
        type: Number,
        default: 0,
    },
    fee: {
        type: mongoose.Types.Decimal128,
        default: 0
    }
});

Object.assign(schema.methods, {
    async applyTx() {
        const { source, target, amount } = this;
        const Balance = this.model('Balance');
        try {
            await this.validate();
            if (source) await Balance.updateOne({ _id: source }, { $inc: { amount: -amount } });
            if (target) await Balance.updateOne({ _id: target }, { $inc: { amount: amount } });
            this.status = 'done';
        } catch (err) {
            this.status = 'error';
            this.log = err.message;
        }
        return this.save();
    }
});

const Transaction = mongoose.model('Transaction', schema);
export default Transaction;
