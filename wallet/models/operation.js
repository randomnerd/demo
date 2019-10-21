import config from 'config';
import db from '../db';

const Operation = db.define('operation', {
    uid: {
        type: db.Sequelize.INTEGER,
        allowNull: false,
    },
    wid: {
        type: db.Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'wallets', key: 'id' },
    },
    symbol: {
        type: db.Sequelize.STRING,
        allowNull: false,
    },
    kind: {
        type: db.Sequelize.ENUM,
        values: [ 'take', 'put' ],
        allowNull: false
    },
    value: {
        type: db.Sequelize.DECIMAL,
        allowNull: false,
        min: 0
    },
    meta: {
        type: db.Sequelize.JSONB,
        allowNull: true
    }
}, {
    indexes: [
        { fields: ['symbol', 'uid'] },
        { fields: ['wid'] },
        { fields: ['kind'] },
    ],
    hooks: {
        async beforeCreate(instance) {
            const wallet = await db.models.wallet.findById(instance.wid);
            if (!wallet) throw new Error('Wallet not found');
            if (instance.kind === 'take' && wallet.balance - instance.value < 0) throw new Error('Balance is too low');
            const op =  `"balance" ${instance.kind === 'put' ? '+' : '-'} ${instance.value}`;
            await wallet.update({ balance: db.literal(op) });
            return instance;
        },
        async afterCreate(instance) {
            if (config.hooks && config.hooks.operation) {
                const wallet = await db.models.wallet.findById(instance.wid);
                db.models.hooklog.create({
                    sent: false,
                    name: 'operation',
                    url: config.hooks.operation,
                    body: {
                        op: instance.toJSON(),
                        balance: wallet.balance
                    }
                });
            }
        }
    }
});

Object.assign(Operation.prototype, {
    toJSON() {
        return {
            id: this.id,
            ts: +this.createdAt,
            uid: this.uid,
            kind: this.kind,
            meta: this.meta,
            value: this.value,
            symbol: this.symbol,
        };
    },
    async wallet() {
        return db.models.wallet.findById(this.wid);
    },
});

Object.assign(Operation, {
    findByWallet(wid) {
        return this.findAll({ where: { wid } });
    },
});

export default Operation;
