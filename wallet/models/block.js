import db from '../db';

const Block = db.define('block', {
    hash: {
        type: db.Sequelize.STRING,
        allowNull: false,
    },
    height: {
        type: db.Sequelize.INTEGER,
        allowNull: false
    },
    symbol: {
        type: db.Sequelize.STRING,
        allowNull: false,
    }
}, {
    indexes: [
        { fields: ['symbol', 'hash', 'height'], unique: true },
    ],
});

Object.assign(Block, {
    async getHeight(symbol) {
        const block = await this.findOne({ where: { symbol }, order: [ ['height', 'DESC'] ] });
        return block ? block.height : 0;
    },
});

export default Block;
