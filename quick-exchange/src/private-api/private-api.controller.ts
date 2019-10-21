import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { OrderFilter } from '~database/order/order.dto';
import { ExchangeError, IdBody } from '~exchange-api/exchange-api.dto';
import { ExchangeDefaultRoute, ExchangeRoute, Partner, WebhookWrapperDto } from '~private-api/private-api.dto';
import { SourceTargetDto } from '~zpay-api/zpay-api.dto';
import { PrivateApiService } from './private-api.service';

@ApiUseTags('private')
@Controller('private')
export class PrivateApiController {
    constructor(
        private privateApi: PrivateApiService,
    ) { }

    @ApiOperation({
        title: 'Get exchange orders',
        description: 'Fetch exchange orders',
        operationId: 'getOrders',
    })
    // TODO: negotiate response schema
    @ApiResponse({ status: 500, type: ExchangeError })
    @HttpCode(200)
    @Post('GetOrders')
    async getOrders(@Body() filter: OrderFilter) {
        return this.privateApi.getOrders(filter);
    }

    @ApiOperation({
        title: 'Get all exchange routes',
        description: 'Fetch exchange routes',
        operationId: 'getRoutes',
    })
    @ApiResponse({ status: 200, type: ExchangeRoute, isArray: true })
    @ApiResponse({ status: 500, type: ExchangeError })
    @HttpCode(200)
    @Post('GetRoutes')
    async getRoutes(): Promise<ExchangeRoute[]> {
        return this.privateApi.getRoutes();
    }

    @ApiOperation({
        title: 'Get exchange route',
        description: 'Fetch exchange route',
        operationId: 'getRoute',
    })
    @ApiResponse({ status: 200, type: ExchangeRoute })
    @ApiResponse({ status: 500, type: ExchangeError })
    @HttpCode(200)
    @Post('GetRoute')
    async getRoute(@Body() { source, target }: SourceTargetDto): Promise<ExchangeRoute> {
        const route = await this.privateApi.getRoute(source, target);
        return new ExchangeRoute({ source, target, ...route });
    }

    @ApiOperation({
        title: 'Set exchange route',
        description: 'Update exchange route',
        operationId: 'setRoute',
    })
    @ApiResponse({ status: 200, description: 'Success (no return value)' })
    @ApiResponse({ status: 500, type: ExchangeError })
    @HttpCode(200)
    @Post('SetRoute')
    async setRoute(@Body() route: ExchangeRoute) {
        await this.privateApi.setRoute(route);
    }

    @ApiOperation({
        title: 'Get default exchange route',
        description: 'Fetch default exchange route',
        operationId: 'getDefaultRoute',
    })
    @ApiResponse({ status: 200, type: ExchangeDefaultRoute })
    @ApiResponse({ status: 500, type: ExchangeError })
    @HttpCode(200)
    @Post('GetDefaultRoute')
    async getDefaultRoute(): Promise<ExchangeDefaultRoute> {
        return this.privateApi.getDefaultRoute();
    }

    @ApiOperation({
        title: 'Set default exchange route',
        description: 'Update default exchange route',
        operationId: 'setDefaultRoute',
    })
    @ApiResponse({ status: 200, description: 'Success (no return value)' })
    @ApiResponse({ status: 500, type: ExchangeError })
    @HttpCode(200)
    @Post('SetDefaultRoute')
    async setDefaultRoute(@Body() route: ExchangeDefaultRoute) {
        return this.privateApi.setDefaultRoute(route);
    }

    @ApiOperation({
        title: 'Get partners',
        description: 'Fetch exchange partners',
        operationId: 'getPartners',
    })
    @ApiResponse({ status: 200, type: Partner, isArray: true })
    @ApiResponse({ status: 500, type: ExchangeError })
    @HttpCode(200)
    @Post('GetPartners')
    async getPartners() {
        return this.privateApi.getPartners();
    }

    @ApiOperation({
        title: 'Get partner',
        description: 'Fetch exchange partner by ID',
        operationId: 'getPartner',
    })
    @ApiResponse({ status: 200, type: Partner })
    @ApiResponse({ status: 500, type: ExchangeError })
    @HttpCode(200)
    @Post('GetPartner')
    async getPartner(@Body() { id }: IdBody) {
        return this.privateApi.getPartner(id);
    }

    @ApiOperation({
        title: 'Set partner',
        description: 'Create/update exchange partner',
        operationId: 'setPartner',
    })
    @ApiResponse({ status: 200, type: Partner })
    @ApiResponse({ status: 500, type: ExchangeError })
    @HttpCode(200)
    @Post('SetPartner')
    async setPartner(@Body() partner: Partner) {
        return this.privateApi.setPartner(partner);
    }

    @ApiOperation({
        title: 'Cheque webhook',
        description: 'Endpoint that will receive updates from ZPay',
        operationId: 'webhook',
    })
    @ApiResponse({ status: 200, description: 'Success (no return value)' })
    @ApiResponse({ status: 500, type: ExchangeError })
    @HttpCode(200)
    @Post('webhook')
    async webhook(@Body() data: WebhookWrapperDto) {
        return this.privateApi.webhook(data);
    }
}
