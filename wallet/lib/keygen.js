import Web3 from 'web3';
import bitcore from 'bitcore-lib';
import litecore from 'litecore-lib';
import zcore from 'bitcore-lib-zcash';
import config from 'config';
import _ from 'lodash';

export default function keygen(symbol) {
    let privkey, pubkey, key;
    const cfg = _.find(config.crypto, { symbol });
    switch (symbol.toLowerCase()) {
        case 'eth':
        case 'etc':
        case 'ethtest':
            const web3 = new Web3();
            const account = web3.eth.accounts.create();
            pubkey = account.address.toLowerCase();
            privkey = account.privateKey;
            break;
        case 'btc':
            if (cfg && cfg.regtest) bitcore.Networks.enableRegtest();
            key = new bitcore.PrivateKey.fromRandom(cfg && cfg.testnet ? 'testnet' : 'livenet');
            pubkey = key.toAddress().toString();
            privkey = key.toWIF();
            break;
        case 'ltc':
            if (cfg && cfg.regtest) litecore.Networks.enableRegtest();
            key = new litecore.PrivateKey(cfg && cfg.testnet ? 'testnet' : 'livenet');
            pubkey = key.toAddress().toString();
            privkey = key.toWIF();
            break;
        case 'zec':
            if (cfg && cfg.regtest) zcore.Networks.enableRegtest();
            key = new zcore.PrivateKey.fromRandom(cfg && cfg.testnet ? 'testnet' : 'livenet');
            pubkey = key.toAddress().toString();
            privkey = key.toWIF();
            break;
        default:
            throw new Error(`Unknown symbol ${symbol}`);
    }
    return { pubkey, privkey };
}
