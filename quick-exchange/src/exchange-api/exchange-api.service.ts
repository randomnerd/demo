import { Injectable } from '@nestjs/common';
import { Big } from 'big.js';
import xmlbuilder from 'xmlbuilder';
import { Order } from '~database/order/order.entity';
import { OrderService } from '~database/order/order.service';
import { SettingsService } from '~database/settings/settings.service';
import { PrivateApiService } from '~private-api/private-api.service';
import { ZpayApiService } from '~zpay-api/zpay-api.service';
import { CreateOrderDto, ErrorType, ExchangeActiveRate, ExchangeError } from './exchange-api.dto';
import _ from 'lodash';

@Injectable()
export class ExchangeApiService {
    constructor(
        private zpay: ZpayApiService,
        private privateApi: PrivateApiService,
        private settings: SettingsService,
        private order: OrderService,
    ) { }

    async create(req: CreateOrderDto): Promise<Order> {
        const { amount, address, target, partnerId } = req;

        let partner;
        if (partnerId) {
            partner = await this.settings.getPartner(partnerId);
            if (!partner) throw new ExchangeError(ErrorType.InvalidPartner);
        }

        const [
            source,
            ttl,
            webhookUrl,
            { rate, baseRate },
            reserveAmount,
        ] = await Promise.all([
            this.zpay.create(req.source, true),
            this.settings.get('exchangeTTL'),
            this.settings.get('webhookUrl', true),
            this.zpay.getRate(req.source, target, true),
            this.privateApi.getReserveAmount(target),
        ]);

        const expires = new Date(ttl + new Date().getTime());
        const targetAmount = new Big(amount).mul(new Big(rate));

        if (partnerId) {
            // TODO: partners debug code, to be removed
            const baseAmount = new Big(amount).mul(baseRate);
            const totalProfit = baseAmount.minus(targetAmount);
            const partnerProfit = totalProfit.mul(partner.interest);
            const ourProfit = totalProfit.minus(partnerProfit);
            // tslint:disable-next-line:no-console
            console.log(`Total profit: ${totalProfit.toFixed(8)} ${target}`);
            // tslint:disable-next-line:no-console
            console.log(`Exchange profit: ${ourProfit.toFixed(8)} ${target}`);
            // tslint:disable-next-line:no-console
            console.log(`Partner profit: ${partnerProfit.toFixed(8)} ${target}`);
        }

        if (targetAmount.gt(reserveAmount)) throw new ExchangeError(
            ErrorType.NotEnoughReserve,
            'Not enough reserves to process order.',
        );

        await this.zpay.webhookSet(webhookUrl, source.session);
        return this.order.create({
            rate,
            baseRate,
            amount,
            source,
            target,
            address,
            expires,
            partnerId,
        });
    }

    async find(id: string): Promise<Order> {
        return this.order.get(id);
    }

    async getCurrencies(): Promise<string[]> {
        const currencies = await this.zpay.getCurrencies();
        return currencies.map(c => c.name.toLowerCase());
    }

    async getLocalReserves() {
        const currencies = await this.getCurrencies();
        return await Promise.all(currencies.map(async (currency) => ({
            currency,
            reserve: await this.privateApi.getReserveAmount(currency),
        })));
    }

    async getCoreReserves() {
        const currencies = await this.zpay.getCurrencies();
        return _.compact(currencies.map(c => {
            if (!c.withdraw) return;
            return {
                currency: c.name.toLowerCase(),
                reserve: c.withdraw.reserves,
            };
        }));
    }

    async getReserves() {
        const [ localReserves, coreReserves, currencies ] = await Promise.all([
            this.getLocalReserves(),
            this.getCoreReserves(),
            this.getCurrencies(),
        ]);
        return currencies.map(currency => {
            const core = coreReserves.find(r => r.currency === currency);
            const local = localReserves.find(r => r.currency === currency);
            return {
                currency,
                reserve: Math.min(
                    core && core.reserve ? core.reserve : 0,
                    local && local.reserve ? local.reserve : 0,
                ),
            };
        });
    }

    async getActiveRates(): Promise<ExchangeActiveRate[]> {
        const [ allRoutes, allRates, allReserves, allCurrencies ] = await Promise.all([
            this.settings.getRoutes(),
            this.zpay.getRates(true),
            this.getReserves(),
            this.zpay.getCurrencies(),
        ]);
        const bigToFloat = big => parseFloat(big.toFixed(8));
        return allRoutes.map(route => {
            if (!route) return;
            const src = allCurrencies.find(c => c.name.toLowerCase() === route.source);
            const tgt = allCurrencies.find(c => c.name.toLowerCase() === route.target);
            if (!src || !tgt || !tgt.withdraw) return;
            const srcReserve = allReserves.find(r => r.currency === route.source);
            const tgtReserve = allReserves.find(r => r.currency === route.target);
            if (!srcReserve || !tgtReserve) return;
            const key = `${route.source}>${route.target}`;
            if (!allRates[key] || !allRates[key].raw) return;
            const rate = new Big(1 - route.interest).mul(allRates[key].raw);
            const minAmount = Math.max(route.min, bigToFloat(new Big(tgt.withdraw.min).div(rate)));
            const maxAmount = Math.min(bigToFloat(new Big(tgtReserve.reserve).div(rate)), route.max);
            if (minAmount * tgt.withdraw.min > tgtReserve.reserve) return;

            return {
                from: route.source,
                to: route.target,
                reserve: tgtReserve.reserve,
                minAmount,
                maxAmount,
                in: 1,
                out: bigToFloat(rate),
            };
        }).filter(i => i);
    }

    async getActiveRatesXML(): Promise<string> {
        // XML format:
        // <rates>
        //     <item>
        //         <from>ADVCRUB</from>
        //         <to>BTC</to>
        //         <in>735642</in>
        //         <out>1</out>
        //         <amount>365.7</amount>
        //         <minamount>15000 RUB</minamount>
        //         <maxamount>300000 RUB</maxamount>
        //     </item>
        // </rates>

        const root = xmlbuilder.create('rates');
        const rates = await this.getActiveRates();
        for (const rate of rates) {
            const item = root.ele('item');
            item.ele('from', rate.from.toUpperCase());
            item.ele('to', rate.to.toUpperCase());
            item.ele('in', rate.in);
            item.ele('out', rate.out);
            item.ele('amount', rate.reserve);
            if (rate.minAmount) item.ele('minamount', rate.minAmount);
            if (rate.maxAmount) item.ele('maxamount', rate.maxAmount);
        }
        return root.end({ pretty: process.env.NODE_ENV !== 'production' });
    }
}
