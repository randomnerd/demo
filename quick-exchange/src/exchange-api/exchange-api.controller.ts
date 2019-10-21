import {
    Body,
    CacheInterceptor,
    Controller,
    Get,
    Header,
    HttpCode,
    NotFoundException,
    Post,
    UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { CreateOrderDto, ExchangeActiveRates, ExchangeError, IdBody, OrderDto } from './exchange-api.dto';
import { ExchangeApiService } from './exchange-api.service';

@ApiUseTags('exchange')
@Controller('exchange')
export class ExchangeApiController {
    constructor(
        private exchange: ExchangeApiService,
    ) { }

    @Post('OrderCreate')
    @ApiResponse({
        status: 200,
        type: {data: OrderDto},
        description: 'Order created',
    })
    @ApiResponse({ status: 500, type: ExchangeError })
    @ApiOperation({
        title: 'Create a new order',
        description: 'Starts a new exchange',
        operationId: 'createOrder',
    })
    @HttpCode(200)
    async create(@Body() req: CreateOrderDto): Promise<{data: OrderDto}> {
        const order = await this.exchange.create(req);
        return { data: new OrderDto(order) };
    }

    @ApiResponse({
        status: 200,
        type: {data: OrderDto},
        description: 'Successful load',
    })
    @ApiOperation({
        title: 'Open order',
        description: 'Loads an order from the database',
        operationId: 'openOrder',
    })
    @ApiResponse({ status: 500, type: ExchangeError })
    @HttpCode(200)
    @Post('OrderStatus')
    async find(@Body() { id }: IdBody): Promise<{data: OrderDto}> {
        try {
            const order = await this.exchange.find(id);
            return { data: new OrderDto(order) };
        } catch (e) {
            throw new NotFoundException();
        }
    }

    @ApiOperation({
        title: 'Exchange active rates XML',
        description: 'Fetch exchange rates for enabled currencies in XML format',
        operationId: 'getActiveRatesXML',
    })
    // TODO: not sure yet how to describe XML responses
    @ApiResponse({ status: 200 })
    @ApiResponse({ status: 500, type: ExchangeError })
    @ApiProduces('application/xml')
    @HttpCode(200)
    @Header('Content-Type', 'application/xml')
    @Get('Rates.xml')
    @UseInterceptors(CacheInterceptor)
    async getActiveRatesXML() {
        return this.exchange.getActiveRatesXML();
    }

    @ApiOperation({
        title: 'Exchange active rates',
        description: 'Fetch exchange rates for enabled currencies',
        operationId: 'getActiveRates',
    })
    @ApiResponse({ status: 200, type: ExchangeActiveRates })
    @ApiResponse({ status: 500, type: ExchangeError })
    @HttpCode(200)
    @Post('Rates')
    @UseInterceptors(CacheInterceptor)
    async getActiveRates() {
        return { data: { rates: await this.exchange.getActiveRates() } };
    }
}
