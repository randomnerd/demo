import crypto from 'crypto';
import bs58 from 'bs58';

export function ripemd160(buf) {
    return crypto.createHash('ripemd160').update(buf).digest();
}

export function sha256(buf) {
    return crypto.createHash('sha256').update(buf).digest();
}

export function random(len = 32) {
    return crypto.randomBytes(len).toString('hex');
}

export function sha256ripemd160(buf) {
    return ripemd160(sha256(buf));
}

export function addressPubkey(str) {
    return new Buffer(bs58.decode(str)).slice(1,21);
}

export function addressScript(str) {
    const pubkey = addressPubkey(str);
    return Buffer.concat([new Buffer([0x76, 0xa9, 0x14]), pubkey, new Buffer([0x88, 0xac])]).toString('hex');
}

export default {
    sha256,
    ripemd160,
    addressPubkey,
    addressScript,
    sha256ripemd160
};
