import { HttpService, Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '~database/settings/settings.service';
import { ErrorType, ExchangeError } from '~exchange-api/exchange-api.dto';
import { Cheque, Currency, RawRatesDto } from './zpay-api.dto';

interface ChequeResponse {
    cheque: Cheque;
}

interface CreateResponse extends ChequeResponse {
    session: string;
}

@Injectable()
export class ZpayApiService {
    private session?: string;
    private readonly logger = new Logger(ZpayApiService.name);

    constructor(
        private http: HttpService,
        private settings: SettingsService,
    ) { }

    async create(currency: string = 'usd', getAddress: boolean = true): Promise<Cheque> {
        const resp: CreateResponse = await this.send('New');
        if (resp.cheque.currency !== currency) {
            resp.cheque = await this.convert(currency, resp.session);
        }
        resp.cheque.session = resp.session;
        if (getAddress) {
            try {
                resp.cheque.address = await this.topup(currency, resp.session);
            } catch { }
        }
        return new Cheque(resp.cheque);
    }

    async auth(pubkey: string, privkey: string): Promise<Cheque> {
        const { cheque, session }: CreateResponse = await this.send(
            'Auth',
            { public: pubkey, private: privkey },
        );
        cheque.session = session;
        return cheque;
    }

    status(session?: string) {
        return this.send('Status', {}, session);
    }

    async balance(pubkey, privkey, session?): Promise<{ balance: number, session: string }> {
        let cheque;
        if (session) {
            try {
                cheque = (await this.status(session)).cheque;
                return { balance: cheque.balance || 0, session };
            } catch (err) { this.logger.error(err); }
        }
        cheque = await this.auth(pubkey, privkey);
        return { balance: cheque.balance || 0, session: cheque.session };
    }

    async reissue(pubkey: string, privkey: string): Promise<Cheque> {
        const { cheque }: ChequeResponse = await this.send(
            'Reissue',
            { public: pubkey, private: privkey },
        );
        return cheque;
    }

    async convert(currency: string, session?: string): Promise<Cheque> {
        const { cheque }: ChequeResponse = await this.send(
            'Convert',
            { currency },
            session,
        );
        return cheque;
    }

    async topup(currency: string, session?: string): Promise<string> {
        const { address } = await this.send(
            'Topup',
            { currency, model: 'Address', data: {} },
            session,
        );
        return address;
    }

    setSession(session: string) {
        this.session = session;
    }

    unsetSession() {
        this.session = null;
    }

    getSession(): string | null {
        return this.session;
    }

    async getAxiosConfig(session?: string) {
        const config = {
            timeout: 5000,
            baseURL: await this.settings.get('zpayUrl', true),
            headers: { 'x-api-token': await this.settings.get('zpayToken', true ) },
            // debug proxy - dont remove
            // proxy: { host: 'localhost', port: 6152 },
        };
        if (!session && this.session) session = this.session;
        if (session) config.headers['x-auth-token'] = session;
        return config;
    }

    getAxiosObserver(resolve, reject) {
        return {
            next: ({ data }) => {
                if (data.data && Object.keys(data).length === 1) data = data.data;
                if (process.env.NODE_ENV !== 'production')
                    this.logger.debug(`Response OK: ${JSON.stringify(data, null, 4)}`);
                resolve(data);
            },
            error: (e) => {
                this.logger.error(e.response ? e.response.data : e.message, e.stack);
                const msg = process.env.NODE_ENV !== 'production' ?
                    undefined :
                    e.response ? e.response.data : e;
                reject(new ExchangeError(ErrorType.ServerError, msg));
            },
        };
    }

    webhookSet(webhook: string, session?: string) {
        return this.send('WebhookSet', { webhook }, session);
    }

    webhookDelete(session?: string) {
        return this.send('WebhookDelete', {}, session);
    }

    async getRates(extra: boolean = false): Promise<RawRatesDto> {
        const { rates } = await this.send('Rates', { extra });
        return rates;
    }

    async getCurrencies() {
        const data = await this.send('Currencies');
        const currencies: Currency[] = Object.values(data.currencies);
        return currencies.filter(c => (c.topup && c.withdraw));
    }

    async getRate(
        source: string,
        target: string,
        extra: boolean = false,
    ): Promise<{ rate: number, baseRate?: number }> {
        const args = { extra, from: source, to: target };
        const { rates } = await this.send('Rates', args);
        const rate = rates[`${source}>${target}`];
        if (!rate) throw new ExchangeError(ErrorType.RateMissing);
        return { rate: rate.rate, baseRate: rate.raw };
    }

    async mergeWithKeys(pubkey: string, privkey: string, session?: string) {
        const cheque = await this.auth(pubkey, privkey);
        return this.merge(cheque.session, session);
    }

    async merge(mergeSession: string, session?: string) {
        return this.send('Merge', { sessions: [ mergeSession ] }, session);
    }

    async withdraw(
        amount: number,
        address: string,
        session: string,
        currency: string,
    ) {
        const args = {
            amount,
            currency,
            data: { address },
            model: 'Address',
        };
        return this.send('Withdraw', args, session);
    }

    // TODO: implement proper split call
    async moveToCheque(
        target: string,
        amount: number,
        currency: string,
        session: string,
    ) {
        const args = {
            splits: {
                [target]: { currency, amount },
            },
        };
        return this.send('Split', args, session);
    }

    async moveToChequeWithKeys(
        target: string,
        amount: number,
        currency: string,
        [ pubkey, privkey ]: string[],
    ) {
        const { session } = await this.auth(pubkey, privkey);
        return this.moveToCheque(target, amount, currency, session);
    }

    send(method: string, args: object = {}, session?: string): Promise<any> {
        const misc = [ 'Rates', 'admin/test/ChequeOperations' ];
        return new Promise(async (resolve, reject) => {
            const config = await this.getAxiosConfig(session);
            const observer = this.getAxiosObserver(resolve, reject);
            if (!misc.includes(method)) method = `cheque/${method}`;
            if (process.env.NODE_ENV !== 'production') {
                this.logger.debug(`Call ${method}, ${JSON.stringify(args)}`);
            }
            this.http.post(method, args, config).subscribe(observer);
        });
    }
}
