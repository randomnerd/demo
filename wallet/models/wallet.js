import db from '../db';

const Wallet = db.define('wallet', {
    uid: {
        type: db.Sequelize.INTEGER,
        allowNull: false,
    },
    symbol: {
        type: db.Sequelize.STRING,
        allowNull: false,
    },
    balance: {
        type: db.Sequelize.DECIMAL,
        defaultValue: 0,
        min: 0
    },
}, {
    indexes: [
        { fields: ['uid', 'symbol'], unique: true },
    ],
});

Object.assign(Wallet.prototype, {
    toJSON() {
        return {
            id: this.id,
            uid: this.uid,
            symbol: this.symbol,
            balance: this.balance
        };
    },
    async toJSONwithAddress() {
        const address = await db.models.address.getForWallet(this.id);
        return {
            id: this.id,
            uid: this.uid,
            symbol: this.symbol,
            balance: this.balance,
            address: address.pubkey,
        };
    },
    transactions() {
        return db.models.transaction.findByWallet(this.id);
    },
    operations() {
        return db.models.operation.findByWallet(this.id);
    },
    async address() {
        const address = await db.models.address.getForWallet(this.id);
        return address.pubkey;
    },
    async newAddress() {
        const address = await db.models.address.create({
            uid: this.uid,
            wid: this.id,
            symbol: this.symbol
        });
        return address.pubkey;
    },

    async _op(kind, value, meta) {
        await db.models.operation.create({
            kind,
            meta,
            value,
            wid: this.id,
            uid: this.uid,
            symbol: this.symbol
        });
        await this.reload();
        return this.balance;
    },

    take(value, meta) {
        return this._op('take', value, meta);
    },

    put(value, meta) {
        return this._op('put', value, meta);
    }
});

Object.assign(Wallet, {
    async getByUid(uid, symbol) {
        symbol = symbol.toLowerCase();
        let wallet = await this.findOne({ where: { uid, symbol } });
        if (!wallet) wallet = await this.create({uid, symbol});
        return wallet;
    }
});

export default Wallet;
