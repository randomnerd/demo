import { ApiModelProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBoolean, IsDecimal,
    IsDefined,
    IsEnum,
    IsNumber,
    IsNumberString,
    IsOptional,
    IsPositive,
    IsString,
    IsUUID,
    Length,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';
import { DeepPartial } from 'typeorm';
import uuid from 'uuid/v4';

export enum PaymentStatus {
    Pending = 'pending',
    Complete = 'complete',
}

export class WebhookDto {
    @ApiModelProperty({
        type: 'string',
        example: '013685432612',
        description: 'Cheque ID',
    })
    @IsNumberString()
    @Length(12)
    cheque: string;

    @ApiModelProperty({
        type: 'number',
        format: 'double',
        example: 12.345,
        description: 'Topup amount',
    })
    @IsNumberString()
    amount: number;

    @ApiModelProperty({
        type: 'string',
        example: 'btc',
        description: 'Topup currency',
    })
    @Length(3, 4)
    @IsString()
    currency: string;

    @ApiModelProperty({
        type: 'string',
        format: 'uuid',
        example: 'a121ba82-fc39-477a-89f4-bfd7914bb706',
        description: 'ZPay operation ID',
    })
    @IsUUID()
    operationId: string;

    @ApiModelProperty({
        type: 'string',
        example: 'd0153ab39bfb5a49e0a94b7398750a49f87a2d99fabe75d69cfda00858eed128',
        description: 'Blockchain transaction ID',
    })
    @IsString()
    @Length(64, 66)
    transactionId: string;

    @ApiModelProperty({
        type: 'number',
        example: 2,
        description: 'Count of transaction confirmations on blockchain',
    })
    @IsNumber()
    @Min(0)
    confirmations: number;

    @ApiModelProperty({
        type: 'number',
        example: 2,
        description: 'Confirmations count for transaction to complete',
    })
    @IsNumber()
    @IsPositive()
    confirmationsNeeded: number;

    @ApiModelProperty({
        type: 'enum',
        enum: Object.values(PaymentStatus),
        example: PaymentStatus.Pending,
        description: 'Payment status',
    })
    @IsEnum(PaymentStatus)
    status: PaymentStatus;
}

enum WebhookType {
    Topup = 'topup',
    Withdraw = 'withdraw',
}

export class WebhookWrapperDto {
    @ApiModelProperty({
        description: 'Operation type',
        example: 'topup',
        type: 'enum',
        enum: Object.values(WebhookType),
    })
    @IsEnum(WebhookType)
    type: WebhookType;

    @ApiModelProperty({
        description: 'Webook payload',
        type: WebhookDto,
    })
    @IsDefined()
    @ValidateNested()
    @Type(() => WebhookDto)
    data: WebhookDto;
}

export class ExchangeDefaultRoute {
    @ApiModelProperty({ description: 'Disable route', example: false, type: 'boolean' })
    @IsBoolean()
    disabled: boolean;

    @ApiModelProperty({ description: 'Interest', example: 0.05, type: 'number', format: 'double' })
    @IsNumber()
    interest: number;

    @ApiModelProperty({ description: 'Minimum amount', example: 0.05, type: 'number', format: 'double' })
    @IsNumber()
    min?: number;

    @ApiModelProperty({ description: 'Maximum amount', example: 0.05, type: 'number', format: 'double' })
    @IsNumber()
    max?: number;

    constructor(obj?: DeepPartial<ExchangeDefaultRoute>) {
        if (!obj) return;
        this.interest = obj.interest;
        this.disabled = obj.disabled;
        this.min = obj.min;
        this.max = obj.max;
    }
}

export class ExchangeRoute extends ExchangeDefaultRoute {
    @ApiModelProperty({ description: 'Source currency', example: 'btc' })
    @IsString()
    source: string;

    @ApiModelProperty({ description: 'Target currency', example: 'eth' })
    @IsString()
    target: string;

    constructor(route?: DeepPartial<ExchangeRoute>) {
        super(route);
        if (!route) return;
        this.source = route.source;
        this.target = route.target;
    }
}

export class Partner {
    @ApiModelProperty({
        description: 'Partner ID',
        format: 'uuid',
        example: 'a121ba82-fc39-477a-89f4-bfd7914bb706',
        required: false,
    })
    @IsOptional()
    @IsUUID()
    id?: string;

    @ApiModelProperty({
        description: 'Partner name',
        example: 'partner1',
    })
    @IsString()
    name: string;

    @ApiModelProperty({
        description: 'Cheque to accumulate partner profits',
        pattern: '^\d{12}-\d{23}$',
        example: '013685432612-62917325638949262215670',
        required: false,
        readOnly: true,
    })
    @IsString()
    @IsOptional()
    @Length(36)
    cheque?: string;

    @ApiModelProperty({
        description: 'Partner\'s interest on exchange profits; 1 = 100%, 0.1 = 10%',
        type: 'number',
        format: 'double',
        example: 0.10,
    })
    @IsNumber()
    @Min(0.001)
    @Max(1)
    interest: number;

    constructor(partner?: DeepPartial<Partner>) {
        this.id = uuid();
        if (!partner) return;
        if (partner.id) this.id = partner.id;
        this.name = partner.name;
        this.cheque = partner.cheque;
        this.interest = partner.interest;
    }
}
