import { CacheModule, Module } from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';
import { ConfigModule } from '~config/config.module';
import { ConfigService } from '~config/config.service';
import { OrderModule } from '~database/order/order.module';
import { SettingsModule } from '~database/settings/settings.module';
import { PrivateApiModule } from '~private-api/private-api.module';
import { ZpayApiModule } from '~zpay-api/zpay-api.module';
import { ExchangeApiController } from './exchange-api.controller';
import { ExchangeApiService } from './exchange-api.service';

@Module({
    imports: [
        CacheModule.registerAsync({
            imports: [ ConfigModule ],
            inject: [ ConfigService ],
            useFactory: (config: ConfigService) => {
                return {
                    store: redisStore,
                    ttl: config.get('cacheTTL'),
                    url: config.get('redisUrl'),
                };
            },
        }),
        ZpayApiModule,
        PrivateApiModule,
        SettingsModule,
        OrderModule,
    ],
    controllers: [ ExchangeApiController ],
    providers: [ ExchangeApiService ],
    exports: [ ExchangeApiService ],
})
export class ExchangeApiModule {}
