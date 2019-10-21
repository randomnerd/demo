import db from '../db';

const Merchant = db.define('merchant', {
    name: {
        type: db.Sequelize.STRING,
        allowNull: false
    },
    code: {
        type: db.Sequelize.STRING,
        allowNull: false
    },
    wallets: {
        type: db.Sequelize.JSONB,
        allowNull: false
    }
}, {
    indexes: [
        { fields: ['code'], unique: true },
    ],
});

Object.assign(Merchant.prototype, {
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            code: this.code,
            wallets: this.wallets
        };
    },
});

Object.assign(Merchant, {
    async getByCode(code) {
        return this.findOne({ where: { code } });
    },
});

export default Merchant;
