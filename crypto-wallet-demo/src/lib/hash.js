import bitcoin from 'bitcoinjs-lib';
import crypto from 'crypto';
import config from 'config'

const network = bitcoin.networks[config.network];

export function newRoot() {
    const seed = crypto.randomBytes(64);
    return bitcoin.bip32.fromSeed(seed, network);
}

export function loadRoot(key) {
    return bitcoin.bip32.fromBase58(key, network);
}

export function getAlias(root, account = 0, keypair = 0) {
    return root.derivePath(`m/${account}'/0/${keypair}`);
}

export function getAliasFromKey(rootkey, i = 0) {
    const root = loadRoot(rootkey);
    const child = root.derivePath(`m/${i}`);
    const { address, script, redeemScript } = getAddressAndScript(child);
    const key = child.toBase58();
    const xpub = child.neutered().toBase58();
    return { key, script, redeemScript, address, xpub };
}

export function getAddressAndScript(node) {
    const { address, output, redeem } = bitcoin.payments.p2sh({
        network,
        redeem: bitcoin.payments.p2wpkh({ pubkey: node.publicKey, network })
    });
    return { address, script: output.toString('hex'), redeemScript: redeem.output.toString('hex') };
}
