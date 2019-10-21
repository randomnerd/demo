import db from '../db';
import { encrypt } from '../lib/password';
import { User, Currency, TradePair } from '../models';
import checkAdmin from '../lib/check_admin';

export async function addBalance({userId, currencyId, amount}, respond) {
  try {
    await checkAdmin(this);
    let balance = await Currency.userBalance(userId, currencyId);
    await balance.update({ amount: balance.amount.plus(amount) });
    respond(null, balance);
  } catch (error) {
    respond(error);
  }
}

export async function addCurrency(doc, respond) {
  try {
    await checkAdmin(this);
    let currency = await Currency.create(doc);
    respond(null, currency);
  } catch (error) {
    console.error(error);
    respond(error);
  }
}

export async function addPair(doc, respond) {
  try {
    await checkAdmin(this);
    let pair = await TradePair.create(doc);
    respond(null, pair);
  } catch (error) {
    respond(error);
  }
}

export async function addUser({email, username, password, role}, respond) {
  try {
    await checkAdmin(this);
    let encrypted = await encrypt(password);
    let user = await User.create({email, username, password: encrypted, role});
    respond(null, user);
  } catch (error) {
    respond(error);
  }
}

export async function resetDB(params, respond) {
  try {
    await checkAdmin(this);
    await db.sync({ force: true });
    respond(null, true);
  } catch (error) {
    respond(error);
  }
}

export async function banUser({ userId, chatBanned, banned }, respond) {
  try {
    await checkAdmin(this);
    let user = await User.findById(userId);
    if (chatBanned !== undefined) user.chatBanned = chatBanned;
    if (banned !== undefined) user.banned = banned;
    await user.save();
    respond(null, user);
  } catch (error) {
    console.error(error);
    respond(error);
  }
}

export async function setAdmin({ userId, admin }, respond) {
  try {
    await checkAdmin(this);
    let user = await User.findById(userId);
    user.role = admin ? 'admin' : 'user';
    await user.save();
    respond(null, user);
  } catch (error) {
    console.error(error);
    respond(error);
  }
}
