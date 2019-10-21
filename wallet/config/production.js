function minutes(n) { return n * 60 * 1000; }
function seconds(n) { return n * 1000; }

module.exports = {
    db: {
        user: process.env.DB_USER || 'postgres',
        pass: process.env.DB_PASS || null,
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        name: process.env.DB_NAME || 'poswallet'
    },
    crypto: [
        {
            symbol: 'eth',
            type: 'eth',
            // host: 'blocknets.squarex.moscow',
            // port: 8546,
            // connection: 'ws',
            host: 'mainnet.infura.io',
            connection: 'https',
            port: 8545,
            interval: seconds(15),
            numConf: 10,
            hotWallet: {
                pubkey: '0x127f73eca9b52cb8dc050385b0b33e94fd54c505',
                privkey: '0x2fd0324f6e0814d19e6ca086e9bb1b5d32b4333774f7378616dc88c25004b24d',
            },
            blockTime: seconds(15)
        },
        {
            symbol: 'etc',
            type: 'eth',
            host: 'blocknets.squarex.moscow',
            port: 9546,
            connection: 'ws',
            interval: seconds(15),
            numConf: 10,
            hotWallet: {
                pubkey: '0x127f73eca9b52cb8dc050385b0b33e94fd54c505',
                privkey: '0x2fd0324f6e0814d19e6ca086e9bb1b5d32b4333774f7378616dc88c25004b24d',
            },
            blockTime: seconds(15)
        },
        {
            symbol: 'btc',
            type: 'btc',
            port: 8332,
            host: 'blocknets.squarex.moscow',
            username: 'app',
            password: 'H5TF-2fNF9H6_Ef_h0WtHLZC2txPsw13GKWIZtqvA08=',
            interval: minutes(10),
            numConf: 3,
            networkFee: 0.00002,
            hotWallet: {
                pubkey: '1MV2dXyaGty65r265o72L5SNLktYaqrC6q',
                privkey: 'KzBKpZZT6yYAch6wHdChxDAD7DXPaLD7eXyoxRenR5Bb1GSjD4W1',
            },
            blockTime: minutes(10)
        },
        {
            symbol: 'ltc',
            type: 'btc',
            port: 9332,
            host: 'blocknets.squarex.moscow',
            username: 'app',
            password: 'H5TF-2fNF9H6_Ef_h0WtHLZC2txPsw13GKWIZtqvA08=',
            interval: minutes(2.5),
            numConf: 5,
            networkFee: 0.002,
            hotWallet: {
                pubkey: 'LYmyiBnzxKRajBPQN5nykuzLk1jxLomSJc',
                privkey: 'T8MEozRRT4o9H8T7mMqXeo24PFdXcGSu6PkfEU85CXRe9rzrcdXL',
            },
            blockTime: minutes(2.5)
        },
    ]
};
