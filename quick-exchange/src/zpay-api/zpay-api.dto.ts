import { ApiModelProperty } from '@nestjs/swagger';
import { IsNumber, IsNumberString, IsString } from 'class-validator';
import { DeepPartial } from 'typeorm';

export class Cheque {
    @ApiModelProperty({
        type: 'string',
        description: 'Cheque public key',
        example: '013685432612',
    })
    @IsNumberString()
    public: string;

    @ApiModelProperty({
        type: 'string',
        description: 'Cheque private key',
        example: '76047467348080903744667',
    })
    @IsNumberString()
    private: string;

    @ApiModelProperty({
        type: 'number',
        format: 'double',
        description: 'Cheque balance',
        example: 12.345,
    })
    @IsNumber()
    balance: number;

    @ApiModelProperty({
        type: 'string',
        description: 'Cheque currency',
        example: 'btc',
    })
    @IsString()
    currency: string;

    @ApiModelProperty({
        type: 'string',
        description: 'Cheque topup address',
        example: '2N5Gyxqw5hk2n9ewFqqT4soLnuLgHy1TLnw',
    })
    @IsString()
    address: string;

    @ApiModelProperty({
        type: 'string',
        description: 'Cheque session key',
        example: '58BgoQYUWAZ0Qp/3nqIUo9iSLFNhmFYkqu+jsmSAwG4=',
    })
    @IsString()
    session?: string;

    constructor(data?: DeepPartial<Cheque>) {
        if (!data) return;
        this.address = data.address;
        this.public = data.public;
        this.private = data.private;
        this.balance = data.balance;
        this.currency = data.currency;
        this.session = data.session;
    }

    get key(): string {
        if (!this.public || !this.private) return '';
        return `${this.public}-${this.private}`;
    }

    set key(value: string) {
        const keys = value.split('-');
        if (keys.length !== 2) throw new Error('Bad value');
        this.public = keys[0];
        this.private = keys[1];
    }
}

export interface Currency {
    name: string;
    nameFull: string;
    symbol: string;
    round: number;
    withdraw: false | {
        model: string,
        fee: number,
        min: number,
        reserves: number,
    };
    topup: false | {
        model: string,
        fee: number,
        min: number,
        confirmations: number,
    };
    regexAddress: string;
}

export interface RawRateDto {
    readonly from: string;

    readonly to: string;

    readonly rate: number;

    readonly raw: number;

    readonly updated: string;
}

export interface RawRatesDto {
    [route: string]: RawRateDto;
}

export class SourceTargetDto {
    @ApiModelProperty({ description: 'Source currency', example: 'btc' })
    @IsString()
    source: string;

    @ApiModelProperty({ description: 'Target currency', example: 'eth' })
    @IsString()
    target: string;

    constructor(obj?: { source: string, target: string }) {
        if (obj) {
            this.source = obj.source;
            this.target = obj.target;
        }
    }
}
