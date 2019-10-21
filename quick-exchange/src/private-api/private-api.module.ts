import { Module } from '@nestjs/common';
import { OrderModule } from '~database/order/order.module';
import { SettingsModule } from '~database/settings/settings.module';
import { ZpayApiModule } from '~zpay-api/zpay-api.module';
import { PrivateApiController } from './private-api.controller';
import { PrivateApiService } from './private-api.service';

@Module({
    imports: [ ZpayApiModule, SettingsModule, OrderModule ],
    controllers: [ PrivateApiController ],
    providers: [ PrivateApiService ],
    exports: [ PrivateApiService ],
})
export class PrivateApiModule {}
