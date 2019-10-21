import _ from 'lodash';
import Decimal from 'decimal.js';
import Sequelize from 'sequelize';
import db from '../db';
import Currency from './currency';
import notifiers from '../lib/notify_model';

export const Trade = db.define('trade', {
  srcUserId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  dstUserId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  tradePairId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: { model: 'tradepairs', key: 'id' }
  },
  srcOrderId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: { model: 'orders', key: 'id' }
  },
  dstOrderId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: { model: 'orders', key: 'id' }
  },
  amount: {
    type: Sequelize.DECIMAL,
    allowNull: false,
    validate: { min: 0.00000001 }
  },
  price: {
    type: Sequelize.DECIMAL,
    allowNull: false,
    validate: { min: 0.00000001 }
  }
}, {
  getterMethods: {
    amount()    { return new Decimal(this.getDataValue('amount')); },
    price()     { return new Decimal(this.getDataValue('price')); },
    dstAmount() { return this.amount.mul(this.price); },
  },
  setterMethods: {
    amount(val) { this.setDataValue('amount', val.toString()) },
    price(val)  { this.setDataValue('price', val.toString()) },
  },
  indexes: [
    { fields: [ 'tradePairId' ] },
    { fields: [ 'srcUserId', 'dstUserId' ] },
    { fields: [ 'srcOrderId', 'dstOrderId' ] }
  ]
});

// Class methods
Object.assign(Trade, {
  seed(tradePairId) {
    return this.findAll({
      where: { tradePairId },
      order: [['createdAt', 'DESC']],
      limit: 20
    });
  }
});

// Instance methods
Object.assign(Trade.prototype, {
  channelName() {
    return [`trade.${this.tradePairId}`];
  },

  toJSON() {
    let fields = ['id', 'tradePairId', 'amount', 'dstAmount', 'price', 'createdAt'];
    return _.pick(this.dataValues, fields);
  },

  async moveFunds(our, their) {
    let pair    = await db.models.tradepair.findById(this.tradePairId);
    let srcCurr = pair.srcCurrencyId;
    let dstCurr = pair.dstCurrencyId;
    let [ buyer, seller ] = our.type === 'buy' ? [ our, their ] : [ their, our ];
    let buyerFee = 0, sellerFee = 0;
    if (buyer.fee.gt(0)) {
      buyerFee = buyer.fee.mul(this.amount);
      if (buyerFee.lt(0.00000001)) buyerFee = 0.00000001;
      db.models.income.create({
        subject: buyer,
        amount: buyerFee,
        currencyId: srcCurr
      });
    }
    if (seller.fee.gt(0)) {
      sellerFee = seller.fee.mul(this.dstAmount);
      if (sellerFee.lt(0.00000001)) sellerFee = 0.00000001;
      db.models.income.create({
        subject: seller,
        amount: sellerFee,
        currencyId: dstCurr
      });
    }

    // remove src held for seller as it is being spent
    let sellerSrc = await Currency.userBalance(seller.userId, srcCurr);
    console.log(`sellerSrc ${sellerSrc.amount} | ${sellerSrc.held} - ${this.amount}`);
    await sellerSrc.set('held', sellerSrc.held.minus(this.amount)).save();

    // remove dst held for buyer as it is being spent
    let buyerDst = await Currency.userBalance(buyer.userId, dstCurr);
    console.log(`buyerDst ${buyerDst.amount} | ${buyerDst.held} - ${this.dstAmount}`);
    await buyerDst.set('held', buyerDst.held.minus(this.dstAmount)).save();

    // move src to buyer
    let buyerSrc = buyer.userId === seller.userId ? sellerSrc : await Currency.userBalance(buyer.userId, srcCurr);
    console.log(`buyerSrc ${buyerSrc.amount} + ${this.amount} - ${buyerFee} | ${buyerSrc.held}`);
    db.models.balancechange.create({
      subjectId: this.id,
      subjectType: 'trade',
      userId: buyer.userId,
      currencyId: srcCurr,
      change: this.amount.minus(buyerFee).toString(),
      total: buyerSrc.amount.plus(this.amount.minus(buyerFee)).toString()
    });
    await buyerSrc.set('amount', buyerSrc.amount.plus(this.amount.minus(buyerFee))).save();

    // move dst to seller
    let sellerDst = seller.userId === buyer.userId ? buyerDst : await Currency.userBalance(seller.userId, dstCurr);
    console.log(`sellerDst ${sellerDst.amount} + ${this.dstAmount} | ${sellerDst.held}`);
    db.models.balancechange.create({
      subjectId: this.id,
      subjectType: 'trade',
      userId: seller.userId,
      currencyId: dstCurr,
      change: this.dstAmount.minus(sellerFee).toString(),
      total: sellerDst.amount.plus(this.dstAmount.minus(sellerFee)).toString()
    });
    await sellerDst.set('amount', sellerDst.amount.plus(this.dstAmount.minus(sellerFee))).save();

    // check if there was a price diff and we have to return unused funds
    // only actual if we're buying
    if (our.type !== 'buy') return;
    let diff = this.amount.mul(our.price).minus(this.dstAmount);
    if (diff.gt(0)) {
      console.log(`buyerDst ${buyerDst.amount} + ${diff} | ${buyerDst.held} - ${diff}`);
      buyerDst.held   = buyerDst.held.minus(diff);
      buyerDst.amount = buyerDst.amount.plus(diff);
      await buyerDst.save();
    }
  },

  async updateOrders(our, their) {
    await our.update({ remain: our.remain.minus(this.amount) });
    await their.update({ remain: their.remain.minus(this.amount) });
  },

  updateStats() {
    return db.models.tradestat.updatePair(this.tradePairId, this.price, this.amount);
  },

  async execute(our, their) {
    await this.moveFunds(our, their);
    await this.updateOrders(our, their);
    await this.updateStats();
  }
});

// Notify methods
Object.assign(Trade.prototype, notifiers);

export default Trade;
