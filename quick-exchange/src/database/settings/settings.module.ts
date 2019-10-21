import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '~config/config.module';
import { Setting } from './setting.entity';
import { SettingsService } from './settings.service';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([ Setting ]),
    ],
    providers: [ SettingsService ],
    controllers: [],
    exports: [ SettingsService ],
})
export class SettingsModule {}
