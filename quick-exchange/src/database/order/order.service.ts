import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { OrderFilter } from '~database/order/order.dto';
import { Order } from './order.entity';

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order)
        private readonly orders: Repository<Order>,
    ) { }

    async get(id: string): Promise<Order> {
        return this.orders.findOne(id, { cache: 60 * 1000 });
    }

    async create(params: DeepPartial<Order>): Promise<Order> {
        try {
            return await this.orders.save(params);
        } catch (e) {
            throw new HttpException(e.message, 500);
        }
    }

    async getByCheque(chequeId: string): Promise<Order> {
        const builder = this.orders.createQueryBuilder();
        const order = await builder
            .where('source->>\'public\' = :chequeId', { chequeId })
            .getOne();
        if (!order) throw new NotFoundException();
        return order;
    }

    async save(order: Order) {
        return this.orders.save(order);
    }

    async filter(filter: OrderFilter) {
        let b = this.orders.createQueryBuilder()
            .skip(filter.skip)
            .limit(filter.limit)
            .orderBy('created', 'DESC');
        if (filter.source) b = b.andWhere(
            'source->>\'currency\' = :source',
            { source: filter.source },
        );
        if (filter.target) b = b.andWhere(
            'target = :target',
            { target: filter.target },
        );
        if (filter.since) b = b.andWhere(
            'created >= :since',
            { since: filter.since },
        );
        if (filter.until) b = b.andWhere(
            'created <= :until',
            { until: filter.until },
        );
        if (filter.depositAddress) b = b.andWhere(
            'source->>\'address\' = :depositAddress',
            { depositAddress: filter.depositAddress },
        );
        if (filter.withdrawAddress) b = b.andWhere(
            'address = :address',
            { address: filter.withdrawAddress },
        );
        if (filter.status) b = b.andWhere(
            'status = :status',
            { status: filter.status },
        );
        return await b.getMany();
    }
}
