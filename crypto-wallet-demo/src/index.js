import express from 'express';
import api from './api';
import db from './db';

const app = express();
app.set('port', process.env.PORT || 3000);

app.post('/topup', api.topup);
app.post('/withdraw', api.withdraw);
app.post('/transfer', api.transfer);

db.once('app-init', async () => {
    try {
        const port = app.get('port');
        app.listen(port, () => {
            console.info(`Listening at http://0.0.0.0:${port}`);
        });
    } catch (err) {
        console.error(err);
    }
});
