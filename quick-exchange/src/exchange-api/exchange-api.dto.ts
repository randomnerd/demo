import { InternalServerErrorException } from '@nestjs/common';
import { ApiModelProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsAlphanumeric,
    IsDate,
    IsDateString,
    IsNumber,
    IsNumberString,
    IsOptional,
    IsPositive,
    IsString,
    IsUUID,
    Length,
    ValidateNested,
} from 'class-validator';
import { DeepPartial } from 'typeorm';
import { OrderStatus } from '~database/order/order.dto';
import { Order } from '~database/order/order.entity';
import { RawRateDto, RawRatesDto } from '~zpay-api/zpay-api.dto';

export class IdBody {
    @ApiModelProperty({
        description: 'Object ID',
        format: 'uuid',
    })
    @IsUUID()
    id: string;
}

export class CreateOrderDto {
    @ApiModelProperty({
        format: 'uuid',
        description: 'Referral partner ID',
        example: 'a121ba82-fc39-477a-89f4-bfd7914bb706',
        required: false,
    })
    @IsOptional()
    partnerId: string;

    @ApiModelProperty({
        type: 'number',
        format: 'double',
        example: 0.12345,
        description: 'Exchange amount',
    })
    @IsPositive()
    @IsNumber()
    amount: number;

    @ApiModelProperty({
        example: 'btc',
        description: 'Source currency',
    })
    @Length(3, 4)
    @IsString()
    source: string;

    @ApiModelProperty({
        example: 'eth',
        description: 'Target currency',
    })
    @Length(3, 4)
    @IsString()
    target: string;

    @ApiModelProperty({
        example: '0xb11f48a8d05fa2dd72a1a6d7efe107059254478e',
        description: 'Exchange withdraw address',
    })
    @IsString()
    @IsAlphanumeric()
    address: string;
}

export class OrderSourceDto {
    @ApiModelProperty({
        example: 'btc',
        description: 'Source currency short name',
    })
    @IsString()
    @Length(3, 4)
    currency: string;

    @ApiModelProperty({
        example: '2N5Gyxqw5hk2n9ewFqqT4soLnuLgHy1TLnw',
        description: 'Deposit address',
    })
    @IsString()
    address: string;

    @ApiModelProperty({
        description: 'Deposit cheque number',
        example: '013685432612',
    })
    @IsNumberString()
    @Length(12)
    cheque?: string;
}

export class OrderDto {
    @ApiModelProperty({
        format: 'uuid',
        example: 'c572bba8-2f8e-4bde-963d-c6df8b1663e9',
        description: 'Exchange ID',
    })
    @IsString()
    @IsUUID()
    id: string;

    @ApiModelProperty({
        type: 'number',
        format: 'double',
        example: 46.6285,
        description: 'Exchange rate',
    })
    @IsNumber()
    @IsPositive()
    rate: number;

    @ApiModelProperty({
        type: 'number',
        format: 'double',
        example: 1.2345,
        description: 'Exchange amount',
    })
    @IsPositive()
    @IsNumber()
    amount: number;

    @ApiModelProperty({
        type: OrderSourceDto,
        description: 'Source currency params',
    })
    @Type(() => OrderSourceDto)
    @ValidateNested()
    source: OrderSourceDto;

    @ApiModelProperty({
        example: 'eth',
        description: 'Target currency name',
    })
    @IsString()
    @Length(3, 4)
    target: string;

    @ApiModelProperty({
        example: '0xb11f48a8d05fa2dd72a1a6d7efe107059254478e',
        description: 'Exchange withdraw address',
    })
    @IsString()
    @IsAlphanumeric()
    address: string;

    @ApiModelProperty({
        description: 'Operation status',
        enum: Object.values(OrderStatus),
        example: OrderStatus.Pending,
    })
    status: OrderStatus;

    @ApiModelProperty({
        format: 'date-time',
        example: '2019-07-25T00:03:11.243Z',
        description: 'Exchange last update time',
    })
    @IsDate()
    updated: Date;

    @ApiModelProperty({
        format: 'date-time',
        example: '2019-07-25T00:03:11.243Z',
        description: 'Exchange init time',
    })
    @IsDate()
    created: Date;

    constructor(order: Order) {
        const { currency, address } = order.source;
        this.source = { currency, address };
        const props = [
            'id', 'partnerId', 'rate', 'amount', 'target', 'address',
            'status', 'updated', 'created',
        ];
        for (const prop of props) this[prop] = order[prop];
    }
}

export class RateDto {
    @ApiModelProperty({
        example: 'btc',
        description: 'Source currency',
    })
    @IsString()
    @Length(3, 4)
    source: string;

    @ApiModelProperty({
        example: 'eth',
        description: 'Target currency',
    })
    @IsString()
    @Length(3, 4)
    target: string;

    @ApiModelProperty({
        type: 'number',
        format: 'double',
        example: 46.6285,
        description: 'Exchange rate',
    })
    @IsNumber()
    @IsPositive()
    rate: number;

    @ApiModelProperty({
        format: 'date-time',
        description: 'Timestamp of last update',
        example: '2019-07-25T00:03:11.243Z',
    })
    @IsDateString()
    updated: Date;

    constructor(rawRate: DeepPartial<RawRateDto>) {
        this.rate = rawRate.rate;
        this.source = rawRate.from;
        this.target = rawRate.to;
        this.updated = new Date(rawRate.updated);
    }
}

export interface RatesDto {
    [route: string]: RateDto;
}

export class RatesResponseDto {
    @ApiModelProperty({
        type: 'object',
        description: 'Exchange rates at the moment',
        example: {
            'btc>eth': {
                source: 'btc',
                target: 'eth',
                rate: 12.456,
                updated: new Date().toISOString(),
            },
        },
    })
    rates: RatesDto;

    constructor(rates: RatesDto) {
        this.rates = rates;
    }
}

export function parseRawRates(rawRates: RawRatesDto): RatesDto {
    return Object.keys(rawRates).reduce((memo, key) => {
        memo[key] = new RateDto(rawRates[key]);
        return memo;
    }, {});
}

export enum ErrorType {
    Timeout = 'Timeout',
    NotFound = 'NotFound',
    ServerError = 'ServerError',
    RateExpired = 'RateExpired',
    RateMissing = 'RateMissing',
    UnknownError = 'UnknownError',
    InvalidRoute = 'InvalidRoute',
    InvalidAmount = 'InvalidAmount',
    InvalidPartner = 'InvalidPartner',
    InvalidRequest = 'InvalidRequest',
    InvalidAddress = 'InvalidAddress',
    InvalidCurrency = 'InvalidCurrency',
    NotEnoughReserve = 'NotEnoughReserve',
    InsufficientFunds = 'InsufficientFunds',
}

export class ExchangeError extends InternalServerErrorException {
    @ApiModelProperty({
        type: 'enum',
        enum: Object.values(ErrorType),
        description: 'Error Type',
        example: 'InvalidAmount',
    })
    error: ErrorType;

    @ApiModelProperty({
        description: 'Detailed error message, if any',
        example: 'Detailed error message, if any',
        required: false,
    })
    message: string;

    constructor(error: ErrorType, message?: string) {
        super({ error, message });
        this.message = message;
        this.error = error;
    }
}

export class RateResponseDto {
    @ApiModelProperty({
        description: 'Exchange rate',
        type: 'number',
        format: 'double',
        example: 12.345,
    })
    @IsNumber()
    @IsPositive()
    rate: number;

    constructor(rate: number) {
        this.rate = rate;
    }
}

export class ExchangeActiveRate {
    @ApiModelProperty({
        description: 'Source trading currency',
        example: 'btc',
    })
    @IsString()
    from: string;

    @ApiModelProperty({
        description: 'Target trading currency',
        example: 'eth',
    })
    @IsString()
    to: string;

    @ApiModelProperty({
        type: 'number',
        format: 'double',
        description: 'Amount of `from` currency',
        example: 1,
    })
    @IsNumber()
    in: number;

    @ApiModelProperty({
        type: 'number',
        format: 'double',
        description: 'Amount of `to` currency',
        example: 42,
    })
    @IsNumber()
    out: number;

    @ApiModelProperty({
        type: 'number',
        format: 'double',
        description: 'Amount of `to` currency in exchange reserve',
        example: 100500,
    })
    @IsNumber()
    reserve: number;

    @ApiModelProperty({
        type: 'number',
        format: 'double',
        description: 'Minimum amount of `from` currency accepted for exchange',
        example: 0.01,
    })
    @IsNumber()
    minAmount: number;

    @ApiModelProperty({
        type: 'number',
        format: 'double',
        description: 'Maxmimum amount of `from` currency accepted for exchange',
        example: 1000,
    })
    @IsNumber()
    maxAmount: number;
}

export class ExchangeActiveRates {
    @ApiModelProperty({
        isArray: true,
        type: ExchangeActiveRate,
    })
    rates: ExchangeActiveRate[];
}
