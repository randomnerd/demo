import { Module } from '@nestjs/common';
import { ConfigModule } from '~config/config.module';
import { DatabaseModule } from '~database/database.module';
import { ExchangeApiModule } from '~exchange-api/exchange-api.module';
import { ZpayApiModule } from '~zpay-api/zpay-api.module';

@Module({
    imports: [ ConfigModule, DatabaseModule, ZpayApiModule, ExchangeApiModule ],
    controllers: [],
})
export class AppModule {}
