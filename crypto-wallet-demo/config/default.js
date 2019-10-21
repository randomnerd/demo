module.exports = {
    network: 'regtest',
    maxConf: 2,
    mongoUrl: 'mongodb://localhost/ofg-wallet',
    electrum: {
        host: 'localhost',
        port: 50001,
        proto: 'tcp',
        minProtocol: '1.4',
        clientVersion: '3.3.6'
    },
    bitcoin: {
        port: 18443,
        username: 'user',
        password: 'pass'
    }
};
