import { Optional } from '@nestjs/common';
import { ApiModelProperty } from '@nestjs/swagger';
import Big from 'big.js';
import { IsDate, IsInstance, IsJSON, IsNumber, IsPositive, IsString, IsUUID, Length } from 'class-validator';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { OrderStatus } from '~database/order/order.dto';
import { Cheque } from '~zpay-api/zpay-api.dto';

@Entity()
export class Order {
    @ApiModelProperty({
        format: 'uuid',
        example: 'a121ba82-fc39-477a-89f4-bfd7914bb706',
    })
    @PrimaryGeneratedColumn('uuid')
    @IsUUID()
    id: string;

    @ApiModelProperty({
        format: 'uuid',
        description: 'Referral partner ID',
        example: 'a121ba82-fc39-477a-89f4-bfd7914bb706',
        required: false,
    })
    @Optional()
    @Column({ nullable: true })
    @IsUUID()
    partnerId: string;

    @ApiModelProperty({
        type: 'number',
        example: 45.6285,
        description: 'Exchange rate (fee included)',
    })
    @Column({ type: 'decimal' })
    @IsNumber()
    @IsPositive()
    rate: number;

    @ApiModelProperty({
        type: 'number',
        example: 46.6285,
        description: 'Exchange rate (without fees)',
    })
    @Column({ type: 'decimal' })
    @IsNumber()
    @IsPositive()
    baseRate: number;

    @ApiModelProperty({
        type: 'number',
        example: 0.12345,
        description: 'Exchange amount',
    })
    @Column({ type: 'decimal' })
    @IsNumber()
    @IsPositive()
    amount: number;

    @ApiModelProperty({
        type: Cheque,
        description: 'Exchange source cheque',
    })
    @Column({ type: 'jsonb' })
    @IsInstance(Cheque)
    source: Cheque;

    @ApiModelProperty({
        example: 'eth',
        description: 'Target currency',
    })
    @Column()
    @IsString()
    @Length(3, 4)
    target: string;

    @ApiModelProperty({
        type: 'enum',
        enum: Object.values(OrderStatus),
        description: 'Exchange status',
    })
    @Column({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.Pending,
    })
    @IsString()
    status: OrderStatus;

    @ApiModelProperty({
        example: '0x27b97c9671e1aabf21809f8cc2151fcb84d32652',
        description: 'Exchange withdrawal address',
    })
    @Column()
    @IsString()
    address: string;

    @ApiModelProperty({
        format: 'date-time',
        example: '2019-07-25T00:03:11.243Z',
        description: 'Exchange expiration time',
    })
    @Column({ type: 'timestamp' })
    @IsDate()
    expires: Date;

    @ApiModelProperty({
        format: 'date-time',
        example: '2019-07-25T00:03:11.243Z',
        description: 'Exchange last update time',
    })
    @UpdateDateColumn({ type: 'timestamp' })
    @IsDate()
    updated: Date;

    @ApiModelProperty({
        format: 'date-time',
        example: '2019-07-25T00:03:11.243Z',
        description: 'Exchange init time',
    })
    @CreateDateColumn({ type: 'timestamp' })
    @IsDate()
    created: Date;

    @ApiModelProperty({
        type: 'object',
        description: 'Metadata gathered while processing exchange',
    })
    @Optional()
    @IsJSON()
    @Column({ type: 'jsonb', default: {} })
    meta?: { [key: string]: any };

    getTargetAmount(): Big {
        return new Big(this.amount).mul(this.rate);
    }

    getFullTargetAmount(): Big {
        return new Big(this.amount).mul(this.baseRate);
    }

    getProfit(): Big {
        return this.getFullTargetAmount().minus(this.getTargetAmount());
    }

    getPartnerProfit(interest: number): Big {
        return this.getProfit().mul(interest);
    }
}
