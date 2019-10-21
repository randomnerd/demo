
import { Test, TestingModule } from '@nestjs/testing';
import { PrivateApiController } from './private-api.controller';
import { PrivateApiService } from './private-api.service';
import { ZpayApiService } from '../zpay-api/zpay-api.service';
import { ZpayApiModule } from '../zpay-api/zpay-api.module';
import { DatabaseModule } from '~database/database.module';
import { SettingsModule } from '~database/settings/settings.module';
import { OrderModule } from '~database/order/order.module';
import { HttpModule } from '@nestjs/common';

describe('PrivateApiController', () => {
    let module: TestingModule;
    let privateController: PrivateApiController;
    let privateService: PrivateApiService;

    const defaultRoute = {
        disabled: false,
        interest: 0.005,
        min: 0.000001,
        max: 100000,
    };

    afterEach(async done => {
        await module.close();
        done();
    });

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [ HttpModule, DatabaseModule, SettingsModule, ZpayApiModule, OrderModule ],
            controllers: [ PrivateApiController ],
            providers: [ ZpayApiService, PrivateApiService ],
        }).compile();

        privateService = module.get<PrivateApiService>(PrivateApiService);
        privateController = module.get<PrivateApiController>(PrivateApiController);
    });

    describe('routes', () => {
        it('should save default route', async () => {
            // const result = [ 'test' ];
            // jest.spyOn(privateService, 'findAll').mockImplementation(() => result);
            await privateController.setDefaultRoute(defaultRoute);
            const route = await privateController.getDefaultRoute();
            expect(route).toMatchObject(defaultRoute);
        });
    });
});
