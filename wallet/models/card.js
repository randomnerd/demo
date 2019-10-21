import db from '../db';

const Card = db.define('card', {
    uid: {
        type: db.Sequelize.INTEGER,
        allowNull: false,
    },
    pan: {
        type: db.Sequelize.STRING,
    },
    symbol: {
        type: db.Sequelize.STRING,
        allowNull: false,
        defaultValue: 'bytex'
    },
}, {
    indexes: [
        { fields: ['uid', 'pan'], unique: true },
    ],
});

Object.assign(Card.prototype, {
    async wallet() {
        return db.models.wallet.getByUid(this.uid, this.symbol)
    },
    toJSON() {
        return {
            id: this.id,
            uid: this.uid,
            pan: this.pan,
            symbol: this.symbol,
            ts: +this.createdAt
        };
    },
});

Object.assign(Card, {
    async getByPan(pan) {
        let card = await this.findOne({ where: { pan } });
        if (!card) throw new Error('14');
        return card;
    },

    getByUid(uid) {
        return this.findOne({ where: { uid } });
    }
});

export default Card;
