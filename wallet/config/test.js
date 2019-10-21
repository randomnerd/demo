function minutes(n) { return n * 60 * 1000; }
function seconds(n) { return n * 1000; }

module.exports = {
    db: {
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || null,
        host: process.env.DB_HOST || 'pg',
        port: process.env.DB_PORT || 5432,
        name: process.env.DB_NAME || 'wallet'
    },
    crypto: [
        {
            symbol: 'eth',
            type: 'eth',
            host: 'testblocknets.squarex.moscow',
            port: 18546,
            connection: 'ws',
            interval: seconds(15),
            numConf: 10,
            testnet: true,
            hotWallet: {
                pubkey: '0x127f73eca9b52cb8dc050385b0b33e94fd54c505',
                privkey: '0x2fd0324f6e0814d19e6ca086e9bb1b5d32b4333774f7378616dc88c25004b24d',
            },
        },
        {
            symbol: 'etc',
            type: 'eth',
            host: 'testblocknets.squarex.moscow',
            port: 19546,
            connection: 'ws',
            interval: seconds(15),
            numConf: 10,
            testnet: true,
            hotWallet: {
                pubkey: '0x127f73eca9b52cb8dc050385b0b33e94fd54c505',
                privkey: '0x2fd0324f6e0814d19e6ca086e9bb1b5d32b4333774f7378616dc88c25004b24d',
            },
        },
        {
            symbol: 'btc',
            type: 'btc',
            port: 18332,
            host: 'testblocknets.squarex.moscow',
            username: 'app',
            password: 'H5TF-2fNF9H6_Ef_h0WtHLZC2txPsw13GKWIZtqvA08=',
            interval: minutes(10),
            numConf: 3,
            networkFee: 0.00002,
            testnet: true,
            hotWallet: {
                pubkey: 'mkgQdCq1ogq1JVJTmS4t7npnWtdaSamCDJ',
                privkey: 'cTKS6fv6ZhzPr8XsJxHw8CHCyVe8CsehWAuAtvEahuQXCceWNpXn',
            },
        },
        {
            symbol: 'ltc',
            type: 'btc',
            port: 19332,
            host: 'testblocknets.squarex.moscow',
            username: 'app',
            password: 'H5TF-2fNF9H6_Ef_h0WtHLZC2txPsw13GKWIZtqvA08=',
            interval: minutes(2.5),
            numConf: 5,
            networkFee: 0.002,
            testnet: true,
            hotWallet: {
                pubkey: 'mv9WpZ7QijTRnMXcsELfzvUfed3fYKatiN',
                privkey: 'cTfc4Wfa1P96nZersVEeBVLNx1QcB94mmBYHYD5xHs8L3RSgYjPZ',
            },
        },
        {
            // disabled: true,
            symbol: 'zec',
            type: 'btc',
            host: 'testblocknets.squarex.moscow',
            port: 18232,
            username: 'app',
            password: 'KOAITqi6kl0rcl8LNzEcOmRBSU2mCrR11UhEF7tBb2I',
            interval: seconds(5),
            numConf: 2,
            networkFee: 0.00002,
            testnet: true,
            hotWallet: {
                pubkey: 'tmEQcoT7teW8Keau4TBDXeGWwNGi14RPo2c',
                privkey: 'cUbdR4TwzrHoCDRUuGcbSf9rQWPdGFcP2D7YAErTaUpqZkVHSX43',
            },
        }
    ]
};
