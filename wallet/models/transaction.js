import config from 'config';
import db from '../db';

const Transaction = db.define('transaction', {
    hash: {
        type: db.Sequelize.STRING,
        allowNull: false,
    },
    uid: {
        type: db.Sequelize.INTEGER,
        allowNull: false,
    },
    wid: {
        type: db.Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'wallets', key: 'id' },
    },
    aid: {
        type: db.Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'addresses', key: 'id' },
    },
    symbol: {
        type: db.Sequelize.STRING,
        allowNull: false,
    },
    blkHash: {
        type: db.Sequelize.STRING,
        allowNull: false,
    },
    address: {
        type: db.Sequelize.STRING,
        allowNull: false,
    },
    source: {
        type: db.Sequelize.STRING,
    },
    idx: {
        type: db.Sequelize.INTEGER,
        allowNull: false,
    },
    blk: {
        type: db.Sequelize.INTEGER,
        allowNull: false,
    },
    nconf: {
        type: db.Sequelize.INTEGER,
        defaultValue: 1,
    },
    value: {
        type: db.Sequelize.DECIMAL,
        allowNull: false,
        min: 0
    },
    conf: {
        type: db.Sequelize.BOOLEAN,
        defaultValue: false,
    },
    mature: {
        type: db.Sequelize.BOOLEAN,
        defaultValue: false,
    },
    moved: {
        type: db.Sequelize.BOOLEAN,
        defaultValue: false,
    },
}, {
    indexes: [
        { fields: ['symbol', 'hash'], unique: true },
        { fields: ['uid', 'symbol', 'address'] },
        { fields: ['wid'] },
        { fields: ['aid', 'moved', 'mature'] },
        { fields: ['conf', 'nconf'] },
    ],
    hooks: {
        async afterCreate(instance) {
            if (config.hooks && config.hooks.transaction) {
                db.models.hooklog.create({
                    sent: false,
                    name: 'transaction',
                    url: config.hooks.transaction,
                    body: instance.toJSON()
                });
            }
        }
    }
});

Object.assign(Transaction.prototype, {
    toJSON() {
        return {
            hash: this.hash,
            uid: this.uid,
            symbol: this.symbol,
            blkHash: this.blkHash,
            address: this.address,
            source: this.source,
            idx: this.idx,
            nconf: this.nconf,
            conf: this.conf,
            value: this.value,
        };
    },
    async wallet() {
        return db.models.wallet.findById(this.wid);
    },
    async makeMature() {
        const { hash, address } = this;
        const wallet = await db.models.wallet.findById(this.wid);
        await wallet.put(this.value, { hash, address, op: 'deposit' });
        await this.update({ mature: true });
    }
});

Object.assign(Transaction, {
    findByWallet(wid) {
        return this.findAll({ where: { wid } });
    },
});

export default Transaction;
