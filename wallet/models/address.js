import db from '../db';
import keygen from '../lib/keygen';

const Address = db.define('address', {
    uid: {
        type: db.Sequelize.INTEGER,
        allowNull: false,
    },
    wid: {
        type: db.Sequelize.INTEGER,
        allowNull: false,
    },
    symbol: {
        type: db.Sequelize.STRING,
        allowNull: false,
    },
    pubkey: {
        type: db.Sequelize.STRING,
    },
    privkey: {
        type: db.Sequelize.STRING,
    },
}, {
    indexes: [
        { fields: ['wid'] },
        { fields: ['uid', 'symbol'] },
        { fields: ['symbol', 'pubkey'], unique: true },
    ],
    hooks: {
        beforeCreate(instance) {
            Object.assign(instance, keygen(instance.symbol));
            return instance;
        }
    }
});

Object.assign(Address.prototype, {
    toJSON() {
        return {
            uid: this.uid,
            symbol: this.symbol,
            pubkey: this.pubkey,
        };
    },
});

Object.assign(Address, {
    async getForWallet(wid) {
        const wallet = await db.models.wallet.findById(wid);
        if (!wallet) throw new Error(`Wallet #${wid} not found`);
        let address = await this.findOne({
            where: { wid, uid: wallet.uid, symbol: wallet.symbol },
            order: [['createdAt', 'DESC']]
        });
        if (!address) address = await this.create({
            wid,
            uid: wallet.uid,
            symbol: wallet.symbol
        });
        return address;
    },
    findByWallet(wid) {
        return this.findAll({ where: { wid } });
    },
});

export default Address;
