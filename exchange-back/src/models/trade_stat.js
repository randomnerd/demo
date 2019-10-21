import _ from 'lodash';
import Decimal from 'decimal.js';
import Sequelize from 'sequelize';
import db from '../db';
import notifiers from '../lib/notify_model';

export const TradeStat = db.define('tradestat', {
    pairId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tradepairs', key: 'id' }
    },
    open: {
        type: Sequelize.DECIMAL,
        defaultValue: 0
    },
    high: {
        type: Sequelize.DECIMAL,
        defaultValue: 0
    },
    low: {
        type: Sequelize.DECIMAL,
        defaultValue: 0
    },
    close: {
        type: Sequelize.DECIMAL,
        defaultValue: 0
    },
    volume: {
        type: Sequelize.DECIMAL,
        defaultValue: 0
    },
    ts: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
}, {
    timestamps: false,
    indexes: [
        { fields: ['pairId', 'ts'] }
    ]
});

// Class methods
Object.assign(TradeStat, {
    seed(params) {
        return this.findAll({ where: { pairId: params[0] }, order: [['ts', 'ASC']] });
    },
    async updatePair(pairId, price, amount, frame = 60) {
        let frameLen = frame * 60;
        let ts = Math.floor(+new Date() / 1000 / frameLen) * frameLen;
        let stat = await this.findOne({where: {ts, pairId}});
        if (stat) {
            if (price < stat.low)  stat.low  = price.toString();
            if (price > stat.high) stat.high = price.toString();
            stat.close  = price.toString();
            stat.volume = new Decimal(stat.volume).plus(amount).toDP(8).toString();
            await stat.save();
        } else {
            await this.create({
                ts,
                pairId,
                open:   price.toString(),
                high:   price.toString(),
                low:    price.toString(),
                close:  price.toString(),
                volume: amount.toString()
            });
        }
        let pair = await db.models.tradepair.findById(pairId);
        pair.lastPrice = price.toString();
        let volume = await this.sum('volume', {
            where: {
                ts: { $gte: +new Date() / 1000 - 3600 * 24 }
            }
        });
        pair.volume = volume;
        let dayOldStat = await this.findOne({
            where: {
                ts: { $gte: +new Date() / 1000 - 3600 * 24 }
            }
        });
        pair.delta = dayOldStat ? new Decimal(price).div(dayOldStat.close).mul(100).round().minus(100).toString() : 0;
        await pair.save();
    }
});

// Instance methods
Object.assign(TradeStat.prototype, {
    channelName() {
        return [`tradestat.${this.pairId}`];
    },
    toJSON() {
        let fields = ['id', 'pairId', 'open', 'high', 'low', 'close', 'volume', 'ts'];
        return _.pick(this.dataValues, fields);
    }
});

// Notify methods
Object.assign(TradeStat.prototype, notifiers);


export default TradeStat;
