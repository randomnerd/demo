import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '~config/config.module';
import { Order } from './order.entity';
import { OrderService } from './order.service';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([ Order ]),
    ],
    providers: [ OrderService ],
    controllers: [],
    exports: [ OrderService ],
})
export class OrderModule {}
