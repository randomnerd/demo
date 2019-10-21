import Sequelize from 'sequelize';
import Decimal from 'decimal.js';
import db from '../db';

export const Income = db.define('income', {
  currencyId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: { model: 'currencies', key: 'id' }
  },
  amount: {
    type: Sequelize.DECIMAL,
    defaultValue: 0,
    validate: { min: 0 }
  },
  subjectId: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  subjectType: {
    type: Sequelize.STRING,
    allowNull: false
  },
  ack: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  indexes: [
    { fields: [ 'currencyId', 'ack' ] },
    { fields: [ 'subjectId', 'subjectType' ] },
  ],
  hooks: {
  },
  getterMethods: {
    amount() { return new Decimal(this.getDataValue('amount')); },
    async subject() { return db.models[this.subjectType].findById(this.subjectId);  }
  },
  setterMethods: {
    amount(val) { this.setDataValue('amount', val.toString()) },
    subject(val) {
      this.setDataValue('subjectId', val.id);
      this.setDataValue('subjectType', val.constructor.name);
    }
  }
});

export default Income;
