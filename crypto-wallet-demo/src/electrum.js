import Client from 'bitcoin-core';
import bitcoin from 'bitcoinjs-lib';
// import ElectrumClient from 'electrum-client';
import ec from '../electrumjs/dist/main';
import { chunkString } from './lib/util';
import config from 'config';
import coinselect from 'coinselect';

// dirty hack
const ElectrumClient = typeof ec === 'function' ? ec : ec.default;

export default class ElectrumFeed {
    constructor(lastHeight = 0) {
        const {host, port, proto} = config.electrum;
        this.txCache = {};
        this.lastHeight = lastHeight;
        // this.ecl = new ElectrumClient(port, host, proto);
        this.ecl = new ElectrumClient(host, port, proto);
        this.network = bitcoin.networks[config.network];
    }

    connect() {
        return this.ecl.connect();
    }

    checkVersion(client = config.electrum.clientVersion, protocol = config.electrum.minProtocol) {
        return this.ecl.methods.server_version(client, protocol);
    }

    initBlockFeed() {
        this.ecl.methods.blockchain_headers_subscribe();
        this.ecl.events.on('blockchain.headers.subscribe', this.onBlockHeader.bind(this));
    }

    async init(db, client) {
        try {
            this.db = db;
            this.client = client;
            await this.connect();
            await this.checkVersion();
            await this.initBlockFeed();
            console.info('Electrum initialized.');
            const info = await this.client.getBlockchainInfo();
            await this.updateConfirmations(info.blocks);

        } catch (error) {
            console.error(error);
        }
    }

    sendTx(tx) {
        return this.ecl.methods.blockchain_transaction_broadcast(tx.toHex());
    }

    async getCachedTx(txid) {
        if (!this.txCache[txid]) this.txCache[txid] = await this.ecl.methods.blockchain_transaction_get(txid, true);
        return this.txCache[txid];
    }

    async saveTx(rawtx) {
        const aliases = await this.db.model('Alias').find({ script: { $in: Object.keys(rawtx.delta) } });
        const changes = rawtx.changes = aliases.reduce((memo, { script, bid, uid }) => {
            if (!memo[script]) memo[script] = { bid, uid, delta: 0 };
            memo[script].delta += rawtx.delta[script];
            return memo;
        }, {});
        if (Object.keys(changes).length === 0) return;
        console.log(changes);
        const txs = await Promise.all(Object.keys(changes).map(script => {
            const { bid, delta } = changes[script];
            const txData = {
                txid: rawtx.txid,
                height: rawtx.height,
                type: delta > 0 ? 'topup' : 'withdraw',
                amount: Math.abs(delta).toString(),
            };
            console.log(txData);
            delta > 0 ? txData.target = bid : txData.source = bid;
            return this.db.model('Transaction').replaceOne({
                txid: txData.txid,
                height: txData.height,
                amount: Math.abs(delta)
            }, {
                ...txData,
                conf: rawtx.confirmations
            }, {
                upsert: true,
                omitUndefined: true,
            });
        }));
    }

    async buildTx({source, target, value, feeRate}) {
        console.log(source.address, target, value, feeRate);
        const keyPair = bitcoin.bip32.fromBase58(source.key, this.network);
        const script = bitcoin.address.toOutputScript(target, this.network);
        const targets = [{ script, value }];
        const hashx = bitcoin.crypto.sha256(Buffer.from(source.script, 'hex')).reverse().toString('hex');

        const txb = new bitcoin.TransactionBuilder(this.network);
        const utx = await this.ecl.methods.blockchain_scripthash_listunspent(hashx);
        if (!utx.length) return;
        const utxo = utx.map(({ tx_hash: txId, tx_pos: vout, value }) => ({
            txId,
            vout,
            value,
        }));
        const { inputs, outputs, fee } = coinselect(utxo, targets, feeRate);
        console.log(inputs, outputs, fee);
        inputs.forEach(input => txb.addInput(input.txId, input.vout))
        outputs.forEach(output => {
            if (!output.script) output.script = source.script;
            txb.addOutput(Buffer.from(output.script, 'hex'), output.value)
        });
        console.log(txb.buildIncomplete())
        inputs.forEach((i, vin) => txb.sign({
            vin,
            keyPair,
            witnessValue: inputs[vin].value,
            prevOutScriptType: 'p2sh-p2wpkh',
            redeemScript: Buffer.from(source.redeemScript, 'hex')
        }));
        return txb.build();
    }

    feeRegular() {
        return this.ecl.methods.blockchain_estimatefee(5);
    }

    feePriority() {
        return this.ecl.methods.blockchain_estimatefee(1);
    }

    balance(address) {
        const script = bitcoin.address.toOutputScript(address, this.network);
        return this.ecl.methods.blockchain_scripthash_getBalance(script)
    }

    async onTx(tx, height) {
        try {
            const delta = tx.delta = {};
            tx.height = height;
            tx.confirmations = 1;
            tx.vin.forEach(async ({ txid, vout }) => {
                if (!txid || txid === '0'.repeat(64)) return;
                const intx = await this.getCachedTx(txid)
                const { value, scriptPubKey } = intx.vout[vout];
                if (value <= 0) return;
                const { hex } = scriptPubKey;
                if (delta[hex] === undefined) delta[hex] = 0;
                delta[hex] -= value;
            })
            tx.vout.forEach(({ value, scriptPubKey }) => {
                if (value <= 0) return;
                const { hex } = scriptPubKey;
                if (delta[hex] === undefined) delta[hex] = 0;
                delta[hex] += value;
            });
            if (!Object.keys(delta).length) return;
            await this.saveTx(tx);
        } catch (error) {
            console.error(error);
        }
    }

    setHeight(height) {
        this.lastHeight = this.lastHeight ? height : height - 1;
        return this.updateConfirmations(height);
    }

    async updateConfirmations(height) {
        console.log(`Setting chain height to ${height}...`);
        const pendingTxs = await this.db.model('Transaction').find({
            status: 'pending',
            type: 'topup'
        });
        return Promise.all(pendingTxs.map(tx => {
            const conf = 1 + height - tx.height;
            if (tx.conf === conf) return;
            console.log(`${tx.txid} (${tx._id}): ${tx.conf} -> ${conf}`);
            return this.db.model('Transaction').updateOne({ _id: tx._id }, { $set: { conf } });
        }));
    }

    async onBlockHeader(payload) {
        try {
            const { height } = payload[0];
            await this.setHeight(height);

            const { count, hex: allheaders } = await this.ecl.methods.blockchain_block_headers(this.lastHeight, 1 + height - this.lastHeight);
            const headers = chunkString(allheaders, allheaders.length / count).map((header) => {
                const hash = bitcoin.crypto.hash256(Buffer.from(header, 'hex')).reverse().toString('hex');
                return this.client.getBlockByHash(hash, { extension: 'json' });
            });
            const blocks = await Promise.all(headers);
            await Promise.all(blocks.map(b => Promise.all(b.tx.map(tx => this.onTx(tx, b.height)))))
        } catch (error) {
            console.error(error);
        }
    }
}
