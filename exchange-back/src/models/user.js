import _ from 'lodash';
import crypto from 'crypto';
import Sequelize from 'sequelize';
import randomstring from 'randomstring';
import authenticator from 'otplib/authenticator';
import mailgun, {from} from '../lib/mailgun';
import db from '../db';
authenticator.options = { crypto };

export const User = db.define('user', {
  email: {
    type: Sequelize.STRING,
    unique: { args: true, msg: '16' },
    validate: {
      isEmail: { args: true, msg: '11' }
    }
  },
  username: {
    type: Sequelize.STRING,
    unique: { args: true, msg: '17' }
  },
  realname: {
    type: Sequelize.STRING,
  },
  password: {
    type: Sequelize.STRING
  },
  emailCode: {
    type: Sequelize.STRING
  },
  passwordCode: {
    type: Sequelize.STRING
  },
  otpSecret: {
    type: Sequelize.STRING
  },
  otpEnabled: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  banned: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  chatBanned: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  role: {
    type: Sequelize.ENUM('user', 'admin'),
    defaultValue: 'user'
  }
}, {
  indexes: [
    { unique: true, fields: [ 'email' ] },
    { unique: true, fields: [ 'username' ] },
    { fields: [ 'role' ] },
    { fields: ['emailCode'] },
    { fields: ['passwordCode'] },
  ],
  hooks: {
    beforeCreate(instance) {
      instance.emailCode = randomstring.generate();
      instance.otpSecret = authenticator.generateSecret();
      return instance;
    },
    afterUpdate(instance, options) {
      if (options.fields.includes('email')) instance.emailCode = randomstring.generate();
      return instance;
    },
    afterCreate(instance, options) {
      instance.generateAddresses();
      if (process.env.NODE_ENV === 'production') instance.sendActivationEmail();
    }
  }
});

Object.assign(User.prototype, {
  toJSON() {
    let fields = ['id', 'username', 'realname', 'email', 'role', 'createdAt', 'otpEnabled', 'banned', 'chatBanned'];
    return _.pick(this.dataValues, fields);
  },
  async generateAddresses() {
    let currencies = await db.models.currency.findAll();
    return await Promise.all(currencies.map(c => db.models.address.create({ userId: this.id, currencyId: c.id })));
  },
  sendActivationEmail() {
    let href = process.env.ROOT_URL || 'http://localhost:3333'
    let subject = `Profit.Best - активация аккаунта ${this.username}`;
    let text = `Для активации Вашего аккаунта нажмите на ссылку: ${href}/verifyEmail/${this.email}/${this.emailCode}`;
    return this.sendEmail(subject, text);
  },
  async forgotPassword() {
    if (this.passwordCode) throw new Error(6);
    const passwordCode = randomstring.generate();
    await this.update({ passwordCode });
    let href = process.env.ROOT_URL || 'http://localhost:3333'
    let subject = `Profit.Best - сброс пароля для аккаунта ${this.username}`;
    let text = `Для сброса пароля Вашего аккаунта нажмите на ссылку: ${href}/resetPassword/${this.passwordCode}`;
    return this.sendEmail(subject, text);    
  },
  sendEmail(subject, text) {
    let data = {
      from,
      text,
      subject,
      to: this.email,
    };
    mailgun.messages().send(data, (error, body) => {
      if (error) return console.error(error);
      console.log(text, body);
    });
  }
});

export default User;
