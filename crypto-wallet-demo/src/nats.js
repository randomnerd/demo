import nats from 'ts-nats';
import short from 'short-uuid';
import config from 'config';

export default class MessageQueue {
    constructor() {
        this.db = null;
        this.nc = null;
        this.uuid = short().generate();
    }

    async init(db) {
        try {
            console.info(`Initializing message queue, worker ID: '${this.uuid}'...`);
            this.db = db;
            await this.initConn();
            await this.initSubscriptions();
            await this.initStale();
            this.initWatchers();
            console.info('Message queue initialized.');
        } catch (err) {
            throw err;
        }
    }

    async initConn() {
        try {
            console.info('Connecting NATS...');
            this.nc = await nats.connect({
                payload: nats.Payload.JSON,
                servers: [ 'nats://localhost' ]
            });
            console.info('NATS connected.');
            return this.nc;
        } catch (err) {
            throw err;
        }
    }

    async initStale() {
        const txs = await this.db.model('Transaction').find({ status: 'pending', txid: null });
        if (!txs.length) return;
        console.info(`Found ${txs.length} stale transactions, retrying...`);
        txs.forEach(tx => this.onTransaction({ operationType: 'insert', fullDocument: tx._doc }));
        console.info(`Enqueued ${txs.length} transactions.`)
    }

    async initSubscriptions() {
        console.info('Setting up NATS subscriptions...');
        try {
            await this.nc.subscribe('transactions', this.onTransactionMsg.bind(this), { queue: 'workers' });
        } catch (err) {
            throw err;
        }
        console.info('NATS subscriptions initialized.');
    }

    initWatchers() {
        this.db.model('Transaction').watch().on('change', this.onTransaction.bind(this));
    }

    onTransaction(data) {
        const {
            documentKey: dk,
            updateDescription,
            operationType,
            fullDocument: doc,
        } = data;

        switch (operationType) {
            case 'insert':
                if (!doc || doc.status !== 'pending') return;
                if (doc.txid && doc.type === 'topup' && doc.conf < config.maxConf) return;
                break;
            case 'update':
                const { conf } =  updateDescription.updatedFields;
                if (!conf || conf < config.maxConf) return;
                break;
            default:
                return;
        }
        this.nc.publish('transactions', dk._id);
        console.debug('Enqueue tx', dk._id);
    }

    assignTx(_id) {
        return this.db.model('Transaction').findOneAndUpdate({
            _id,
            status: 'pending',
            workerId: null
        }, {
            $set: {
                status: 'assigned',
                workerId: this.uuid
            }
        }, { new: true });
    }

    async onTransactionMsg(err, msg) {
        const Transaction = this.db.model('Transaction');
        if (err) return console.error(err);
        const doc = await this.assignTx(msg.data);
        try {
            console.debug('Processing tx', doc._id);
            const tx = await Transaction.findOne({ _id: doc._id });
            if (tx.type === 'withdrawal') {
                // const txid = await this.db.feed.
            }
            await tx.applyTx();
        } catch (error) {
            console.error(`Invalid transaction inserted:\n${error.message}`, doc);
            Transaction.findOneAndUpdate({ _id: doc._id }, {
                $set: {
                    status: 'invalid',
                    log: error.message
                }
            }, (err) => {
                if (err) return console.error(err);
                console.debug(`Changed tx ${doc._id} status to 'invalid'`);
            });
        }
    }

    async shutdown() {
        try {
            await this.nc.drain();
            this.nc = null;
        } catch (err) {
            throw err;
        }
    }
}
