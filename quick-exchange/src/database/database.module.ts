import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '~config/config.module';
import { ConfigService } from '~config/config.service';
import { Order } from './order/order.entity';
import { OrderModule } from './order/order.module';
import { Setting } from './settings/setting.entity';
import { SettingsModule } from './settings/settings.module';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ ConfigModule ],
            inject: [ ConfigService ],
            useFactory: (config: ConfigService) => {
                const type = config.get('dbType');
                const url = config.get('dbUrl');
                return {
                    url,
                    type,
                    synchronize: true,
                    entities: [ Setting, Order ],
                    cache: {
                        type: 'redis',
                        options: { url: config.get('redisUrl') },
                    },
                    logging: config.get('env') === 'development' ?
                        [ 'query', 'error' ] : [ 'error' ],
                };
            },
        }),
        SettingsModule,
        OrderModule,
    ],
})
export class DatabaseModule {}
