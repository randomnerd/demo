import cnf from 'config';
import cors from 'cors';
import helmet from 'helmet';
import express from 'express';
import expressAuth from 'express-auth-middle';
import db from './db';
import dispatch from './dispatcher';
import POSdispatch from './pos_dispatcher';
import CryptoClient from './crypto';
import TokenClient from './token';

const port = process.env.PORT || 8080;
const app  = express();

async function init() {
    try {
        await db.sync();
        const clients = global.clients = {};
        for (let item of cnf.crypto) {
            if (item.disabled) continue;
            clients[item.symbol] = new CryptoClient(item);
            clients[item.symbol].start();
        }

        const tokens = global.tokens = {};
        for (let item of cnf.tokens) {
            if (item.disabled) continue;
            tokens[item.symbol] = new TokenClient(item);
            tokens[item.symbol].start();
        }

        console.log(`Started server at http://0.0.0.0:${port}`);
    } catch (error) {
        console.error(error);
    }
}

app.use(helmet());
app.use(express.json({
    verify(req, res, buf) {
        req.rawBody = buf;
    }
}));
if (cnf.auth && cnf.auth.enabled) app.use('/api', expressAuth({
    methods: ['basic-auth'],
    credentials: {
        basicAuthUname: cnf.auth.user,
        basicAuthPword: cnf.auth.pass
    },
    challenge: 'Protected area'
}));
app.use(cors());

app.post('/api', async (req, res) => {
    const { method, params } = req.body;
    const result = await dispatch(method, params || {}, req);
    res.status(result.error ? 500 : 200).send(result);
});

app.post('/pos', async (req, res) => {
    res.send(await POSdispatch(req.body));
});

app.listen(port, init);
