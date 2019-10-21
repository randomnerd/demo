import db from './db';
import crypto from 'crypto';
import { ACL, Block, Wallet, Operation, Card, Merchant } from './models';
import cnf from 'config';

export const methods = {
    put,
    take,
    batch,
    addACL,
    delACL,
    getACL,
    editACL,
    getACLs,
    addCard,
    delCard,
    getCard,
    editCard,
    getCards,
    addMerchant,
    delMerchant,
    getMerchant,
    editMerchant,
    getMerchants,
    withdraw,
    getWallet,
    getWallets,
    getSymbols,
    newAddress,
    getOperations
};

export async function verifyACL(request, method) {
    // check pre-conditions
    const authKey = request.headers['x-auth-key'];
    const authSign = request.headers['x-auth-sign'];
    if (!authKey) throw new Error('No auth key specified');
    if (!authSign) throw new Error('No auth signature specified');
    const acl = await ACL.byPubkey(authKey);
    if (!acl) throw new Error('Wrong auth key specified');
    if (!acl.isMethodAllowed(method)) throw new Error('Method not allowed by ACL');

    // calculate & check signature
    const sign = crypto.createHmac('sha256', Buffer.from(acl.privkey, 'hex'));
    sign.update(request.rawBody);
    const signature = sign.digest('hex');
    // console.log(`authSign: ${authSign}, signature: ${signature}`, request.rawBody.toString());
    if (authSign !== signature) throw new Error('Invalid signature');
}

export async function dispatch(method, params, request) {
    console.log(new Date(), method, params);
    if (typeof methods[method] !== 'function') return { error: 'method not supported' };
    try {
        const ACL_ENABLED = process.env.NO_ACL === undefined;
        const aclCount = await ACL.count();
        if (ACL_ENABLED && aclCount === 0) console.warn('You have ACL enabled but no ACLs are set - allowing request');
        if (ACL_ENABLED && aclCount > 0) await verifyACL(request, method);
        if (params.symbol) params.symbol = params.symbol.toLowerCase();
        return await methods[method](params);
    } catch (error) {
        console.error(error);
        return { error: error.message };
    }
}

export async function getWallets(where) {
    try {
        const records = await Wallet.findAll({where});
        const wallets = await Promise.all(records.map(w => w.toJSONwithAddress()));
        return { wallets };
    } catch (err) {
        console.error(err);
    }
}

export async function getSymbols(where = {}) {
    const symbols = cnf.crypto.map(c => c.symbol)
        .concat(cnf.tokens.map(c => c.symbol))
        .concat(Object.keys(global.tokens));
    return { symbols };
}

export async function addACL({name, methods}) {
    const { pubkey, privkey } = await ACL.create({ name, methods });
    return { pubkey, privkey };
}

export async function delACL({pubkey}) {
    const deleted = await ACL.destroy({ where: { pubkey }});
    if (deleted === 0) throw new Error('ACL not found');
    return { success: true };
}

export async function editACL({pubkey, name, methods}) {
    const acl = await ACL.findOne({ where: { pubkey }});
    if (!acl) throw new Error('ACL not found');
    const result = await acl.update({name, methods});
    return result;
}

export async function getACLs({where}) {
    const records = await ACL.findAll({where});
    const acls = records.map(a => a.toJSON())
    return { acls }
}

export async function getACL({pubkey}) {
    const acl = await ACL.findOne({where: {pubkey}});
    return Object.assign(acl.toJSON(), {privkey: acl.privkey});
}

export async function addCard({uid, symbol, pan}) {
    const card = await Card.create({ uid, symbol, pan });
    return card;
}

export async function delCard({id}) {
    const deleted = await Card.destroy({ where: { id }});
    if (deleted === 0) throw new Error('Card not found');
    return { success: true };
}

export async function editCard({id, fields}) {
    const card = await Card.findOne({ where: { id }});
    if (!card) throw new Error('Card not found');
    const result = await card.update(fields);
    return result;
}

export async function getCards({where}) {
    const records = await Card.findAll({where});
    const cards = records.map(a => a.toJSON())
    return { cards }
}

export async function getCard({id}) {
    const card = await Card.findOne({where: {id}});
    if (!card) throw new Error('Card not found');
    return card;
}

export async function addMerchant(fields) {
    const merchant = await Merchant.create(fields);
    return merchant;
}

export async function delMerchant({id}) {
    const deleted = await Merchant.destroy({ where: { id }});
    if (deleted === 0) throw new Error('Merchant not found');
    return { success: true };
}

export async function editMerchant({id, fields}) {
    const merchant = await Merchant.findOne({ where: { id }});
    if (!merchant) throw new Error('Merchant not found');
    const result = await merchant.update(fields);
    return result;
}

export async function getMerchants({where}) {
    const records = await Merchant.findAll({where});
    const merchants = records.map(a => a.toJSON())
    return { merchants }
}

export async function getMerchant({id}) {
    const merchant = await Merchant.findOne({where: {id}});
    if (!merchant) throw new Error('Merchant not found');
    return merchant;
}

export async function getWallet({uid, symbol}) {
    const wallet = await Wallet.getByUid(uid, symbol);
    return { address: await wallet.address(), balance: parseFloat(wallet.balance) };
}

export async function newAddress({uid, symbol}) {
    const wallet = await Wallet.getByUid(uid, symbol);
    const address = await wallet.newAddress();
    return { address };
}

export async function getOperations(where) {
    const operations = await Operation.findAll({where, order: [['"createdAt"','DESC']]});
    return {operations: operations.map(o => o.toJSON())};
}

export async function take(params) {
    params.kind = 'take';
    return operation(params);
}

export async function put(params) {
    params.kind = 'put';
    return operation(params);
}

export async function withdraw({uid, symbol, addr, value}) {
    const client = global.clients[symbol];
    if (!client) throw new Error('Client not found');
    return client.withdraw(uid, addr, value);
}

export async function batch(ops) {
    const batchResult = [];
    const t = await db.transaction();
    let lastResult = null;
    const runBatch = namespace.bind(async () => {
        for (let op of ops) {
            const { method, params } = op;
            lastResult = await dispatch(method, params);
            batchResult.push(lastResult);
            if (lastResult.error) break;
        }
        lastResult.error ? await t.rollback() : await t.commit();
    }, { transaction: t });
    await runBatch();
    return batchResult;
}

async function operation({ uid, symbol, kind, value, meta }) {
    const wallet = await Wallet.getByUid(uid, symbol);
    const balance = await wallet[kind](value, meta);
    return { balance };
}

export default dispatch;
