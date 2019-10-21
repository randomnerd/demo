import { HttpModule, Module } from '@nestjs/common';
import { SettingsModule } from '~database/settings/settings.module';
import { ZpayApiService } from './zpay-api.service';

@Module({
    imports: [ HttpModule, SettingsModule ],
    providers: [ ZpayApiService ],
    exports: [ ZpayApiService ],
})
export class ZpayApiModule {}
