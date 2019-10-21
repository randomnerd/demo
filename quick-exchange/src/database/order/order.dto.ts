import { ApiModelProperty } from '@nestjs/swagger';
import {
    IsAlphanumeric,
    IsDate,
    IsEnum,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    Length,
    Min,
} from 'class-validator';

export enum OrderStatus {
    Pending = 'pending',  // just created
    PaymentPending = 'payment_pending', // payment seen on blockchain, waiting for confirmation
    Paid = 'paid',
    Done = 'done',
    Failed = 'failed',
    Canceled = 'canceled',
}

export class OrderFilter {
    @ApiModelProperty({
        type: 'string',
        example: 'btc',
        description: 'Source currency',
        required: false,
    })
    @IsOptional()
    @Length(3, 4)
    @IsString()
    source: string;

    @ApiModelProperty({
        type: 'string',
        example: 'eth',
        description: 'Target currency',
        required: false,
    })
    @IsOptional()
    @Length(3, 4)
    @IsString()
    target: string;

    @ApiModelProperty({
        type: 'string',
        format: 'date-time',
        example: '2019-07-25T00:03:11.243Z',
        description: 'Creation time since',
        required: false,
    })
    @IsOptional()
    @IsDate()
    since?: Date;

    @ApiModelProperty({
        type: 'string',
        format: 'date-time',
        example: '2019-07-25T00:03:11.243Z',
        description: 'Creation time until',
        required: false,
    })
    @IsOptional()
    @IsDate()
    until?: Date;

    @ApiModelProperty({
        type: 'string',
        example: '0xb11f48a8d05fa2dd72a1a6d7efe107059254478e',
        description: 'Deposit address',
        required: false,
    })
    @IsOptional()
    @IsString()
    @IsAlphanumeric()
    depositAddress?: string;

    @ApiModelProperty({
        type: 'string',
        example: '0xb11f48a8d05fa2dd72a1a6d7efe107059254478e',
        description: 'Withdraw address',
        required: false,
    })
    @IsOptional()
    @IsString()
    @IsAlphanumeric()
    withdrawAddress?: string;

    @ApiModelProperty({
        type: 'enum',
        enum: Object.values(OrderStatus),
        description: 'Order status',
        required: false,
    })
    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;

    @ApiModelProperty({
        type: 'number',
        example: 100,
        description: 'Limit query to N records',
        required: false,
    })
    @IsOptional()
    @IsPositive()
    @IsNumber()
    limit?: number = 100;

    @ApiModelProperty({
        type: 'number',
        example: 0,
        description: 'Skip first N records when querying',
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    skip?: number;
}
