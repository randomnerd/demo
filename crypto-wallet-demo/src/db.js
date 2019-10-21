import mongoose from 'mongoose';
import models from './models';
import util from './lib/util';
import MessageQueue from './nats';
import ElectrumFeed from './electrum';
import config from 'config';
import Client from 'bitcoin-core';

mongoose.connect(config.mongoUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
});

const db = mongoose.connection;
const msgq = db.msgq = new MessageQueue();
const feed = db.feed = new ElectrumFeed();
const client = db.client = new Client({ ...config.bitcoin, network: config.network });
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async () => {
    console.info('Mongo connected, initializing models...');
    await Promise.all(Object.keys(models).map(name => {
        console.info(`Init model '${name}'`);
        return models[name].init();
    }));
    if (process.env.RESET_DB !== undefined) await reset();
    console.info('Models loaded.');
    await seed();
    await msgq.init(db);
    await feed.init(db, client);
    db.emit('app-init');
});

async function reset() {
    console.warn('Reset DB flag activated, resetting...');
    await Promise.all(Object.keys(models).map(name => {
        console.info(`Reset model '${name}'`);
        return models[name].deleteMany({});
    }));
    console.warn('DB reset done.')
}

async function seed() {
    const accCount = await db.model('Account').countDocuments();
    if (accCount !== 0) return;
    console.info('DB looks empty, initializing with some basic seed...');
    console.info('Creating some accounts...');
    const accounts = util.numericArray(5).map(n => db.model('Account').create({
        handle: `demo-${n}`
    }));
    await Promise.all(accounts);
    console.info('Default accounts created.');
}

export default db;
