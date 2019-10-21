import { Injectable } from '@nestjs/common';
import { Big } from 'big.js';
import { OrderFilter, OrderStatus } from '~database/order/order.dto';
import { Order } from '~database/order/order.entity';
import { OrderService } from '~database/order/order.service';
import { SettingsService } from '~database/settings/settings.service';
import { ErrorType, ExchangeError, OrderDto } from '~exchange-api/exchange-api.dto';
import {
    ExchangeDefaultRoute,
    ExchangeRoute,
    Partner,
    PaymentStatus,
    WebhookWrapperDto,
} from '~private-api/private-api.dto';
import { Cheque } from '~zpay-api/zpay-api.dto';
import { ZpayApiService } from '~zpay-api/zpay-api.service';

@Injectable()
export class PrivateApiService {
    constructor(
        private zpay: ZpayApiService,
        private settings: SettingsService,
        private order: OrderService,
    ) { }

    async createReserveCheque(currency: string): Promise<Cheque> {
        const cheque = await this.zpay.create(currency, false);
        await this.settings.set(`reserves.${currency}`, {
            public: cheque.public,
            private: cheque.private,
            session: cheque.session,
        });
        return cheque;
    }

    async getReserveAmount(currency: string) {
        const keys = await this.settings.get(`reserves.${currency}`);
        if (keys) {
            const { balance, session } = await this.zpay.balance(keys.public, keys.private, keys.session);
            if (session !== keys.session) await this.settings.set(`reserves.${currency}`, { ...keys, session });
            return balance;
        }
        await this.createReserveCheque(currency);
        return 0;
    }

    async getPartnerCheque(partnerId: string, currency: string): Promise<string> {
        let keys = await this.settings.getPartnerCheque(partnerId);
        if (!keys) {
            const cheque = await this.zpay.create(currency);
            keys = `${cheque.public}-${cheque.private}`;
            await this.settings.setPartnerCheque(partnerId, keys);
        }
        return keys;
    }

    async webhook({ type, data }: WebhookWrapperDto) {
        // tslint:disable-next-line:no-console
        console.log(`WEBHOOK: ${type}:\n${JSON.stringify(data, null, 4)}`);

        // we are only interested in topup events
        if (type !== 'topup') throw new ExchangeError(
            ErrorType.InvalidRequest,
            'Only topup hooks are supported yet.',
        );
        const order = await this.order.getByCheque(data.cheque);
        const { source, target, amount, address } = order;

        if (data.status !== PaymentStatus.Complete) {
            // if payment isnt complete, change order status and return
            if (order.status === OrderStatus.Pending) {
                order.status = OrderStatus.PaymentPending;
                await this.order.save(order);
            }
            return new OrderDto(order);
        } else if ([ OrderStatus.PaymentPending, OrderStatus.Pending ].includes(order.status)) {
            // otherwise check deposit cheque balance to match order amount
            const deposit = await this.zpay.auth(source.public, source.private);
            if (deposit.balance < amount) throw new ExchangeError(
                ErrorType.InsufficientFunds,
                'Deposit balance is less than order amount',
            );
            // and set order as paid if everything is fine
            order.status = OrderStatus.Paid;
            order.meta.deposit = data;
            await this.order.save(order);
        }

        // we only process paid orders any further
        if (order.status !== OrderStatus.Paid) throw new ExchangeError(
            ErrorType.InvalidRequest,
            'Bad order status, should be \'Paid\' by now.',
        );

        try {
            const { rate, baseRate } = await this.zpay.getRate(source.currency, target, true);
            const targetAmount = new Big(amount).mul(new Big(rate));
            order.rate = rate;
            order.baseRate = baseRate;

            // check reserves once again
            const reserve = await this.getReserveCheque(target);
            if (targetAmount.gt(reserve.balance)) throw new ExchangeError(
                ErrorType.NotEnoughReserve,
                'Not enough reserves to process order.',
            );

            // merge deposit cheque to reserves
            await this.mergeToReserve(source.session, source.currency);

            // share profit if order has a referral ID
            if (order.partnerId) {
                const partner = await this.settings.getPartner(order.partnerId);
                if (!partner || !partner.cheque) throw new ExchangeError(ErrorType.InvalidPartner);
                const partnerPublic = partner.cheque.split('-')[0];
                const partnerProfit = parseFloat(order.getPartnerProfit(partner.interest).toFixed(8));
                await this.zpay.moveToCheque(partnerPublic, partnerProfit, target, reserve.session);
            }

            order.meta.withdraw = await this.zpay.withdraw(
                parseFloat(targetAmount.toFixed(8)),
                address,
                reserve.session,
                target,
            );
            order.status = OrderStatus.Done;
        } catch (err) {
            // tslint:disable-next-line: no-console
            console.error(JSON.stringify(err, null, 4), err.stack.split('\n'));
            order.meta.error = { message: JSON.stringify(err), stack: err.stack.split('\n') };
            order.status = OrderStatus.Failed;
        }
        await this.order.save(order);
        return new OrderDto(order);
    }

    async getReserveCheque(currency: string): Promise<Cheque> {
        const authData = await this.settings.get(`reserves.${currency}`);
        if (!authData) throw new ExchangeError(ErrorType.InvalidCurrency);
        return this.zpay.auth(authData.public, authData.private);
    }

    async mergeToReserve(session: string, currency: string) {
        const reserveCheque = await this.getReserveCheque(currency);
        return this.zpay.merge(session, reserveCheque.session);
    }

    async getRoutes(): Promise<ExchangeRoute[]> {
        return this.settings.getRoutes();
    }

    async getRoute(source: string, target: string): Promise<ExchangeRoute> {
        return this.settings.getExchangeRoute(source, target);
    }

    async setRoute(route: ExchangeRoute) {
        return this.settings.setExchangeRoute(route);
    }

    async getDefaultRoute(): Promise<ExchangeRoute> {
        return this.settings.getDefaultExchangeRoute();
    }

    async setDefaultRoute(route: ExchangeDefaultRoute) {
        return this.settings.setDefaultExchangeRoute(route);
    }

    async getOrders(filter: OrderFilter): Promise<Order[]> {
        return this.order.filter(filter);
    }

    async getPartners(): Promise<Partner[]> {
        return this.settings.getPartners();
    }

    async getPartner(id: string): Promise<Partner> {
        return this.settings.getPartner(id);
    }

    async setPartner(partner: Partner): Promise<Partner> {
        const cheque = await this.zpay.create('usd', false);
        partner.cheque = cheque.key;
        await this.settings.setPartner(partner);
        return partner;
    }
}
