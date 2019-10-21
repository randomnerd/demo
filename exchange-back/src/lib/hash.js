import crypto from 'crypto';
import bs58 from 'bs58';

let Hash = module.exports;
Hash.ripemd160 = function(buf) {
    return crypto.createHash('ripemd160').update(buf).digest();
};
Hash.sha256 = function(buf) {
    return crypto.createHash('sha256').update(buf).digest();
};

Hash.sha256ripemd160 = function(buf) {
    return Hash.ripemd160(Hash.sha256(buf));
};

Hash.addressPubkey = function(str) {
    return new Buffer(bs58.decode(str)).slice(1,21);
};

Hash.addressScript = function(str) {
    let pubkey = Hash.addressPubkey(str);
    let hashBuffer = Hash.sha256ripemd160(pubkey);
    return Buffer.concat([new Buffer([0x76, 0xa9, 0x14]), pubkey, new Buffer([0x88, 0xac])]).toString('hex');
};
