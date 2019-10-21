import CoinKey from 'coinkey';
import ci from 'coininfo';
import keythereum from 'keythereum';
import SibcoinCI from './sibcoin-ci';
import BiocoinCI from './biocoin-ci';

export default function keygen(ident) {
  let privkey, pubkey, key;
  switch (ident) {
  case 'ETH':
  case 'ETC':
    key = keythereum.create();
    pubkey = '0x' + keythereum.dump('', key.privateKey, key.salt, key.iv).address;
    privkey = key.privateKey.toString('hex');
    break;
  case 'SIB':
    key = CoinKey.createRandom(SibcoinCI);
    pubkey = key.publicAddress;
    privkey = key.privateWif;
    break;
  case 'BIO':
    key = CoinKey.createRandom(BiocoinCI);
    pubkey = key.publicAddress;
    privkey = key.privateWif;
    break;
  case 'BTC':
    key = CoinKey.createRandom(ci.bitcoin.main);
    pubkey = key.publicAddress;
    privkey = key.privateWif;
    break;
  default:
    key = CoinKey.createRandom(ci(ident));
    pubkey  = key.publicAddress;
    privkey = key.privateWif;
  }
  return { pubkey, privkey };
}
