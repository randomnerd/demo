import { INestApplication, ValidationError, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { agent as request } from 'supertest';
import { AppModule } from '../src/app.module';
import { ErrorType, ExchangeError, OrderDto } from '../src/exchange-api/exchange-api.dto';
import { sendEth } from './eth';

describe('AppController (e2e)', () => {
    let app: INestApplication;
    let order: OrderDto;
    // Rinkeby account
    // const ethKey = '0x56fe2328fd97a99045aef106ea41cca1b342241beb5b2d873e18ae1147af0a4c';
    // Devchain account
    const ethKey = '0x4d5db4107d237df6a3d58ee5f70ae63d73d7658d4026f2eefd2f204c81682cb7';

    beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule({
            imports: [ AppModule ],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.enableShutdownHooks();
        app.setGlobalPrefix('/v1');
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            transform: true,
            exceptionFactory: (errors: ValidationError[]) => {
                // tslint:disable-next-line:no-console
                console.log(JSON.stringify(errors, null, 4));
                const msg = errors.map(e => Object.values(e.constraints));
                return new ExchangeError(ErrorType.InvalidRequest, msg.join('; '));
            },
        }));
        await app.init();
    });

    test('Get exchange rates', (done) => {
        request(app.getHttpServer())
            .post('/v1/exchange/Rates')
            .expect(200)
            .expect('Content-Type', /application\/json/)
            .end((err, res) => {
                expect(err).toBeFalsy();
                expect(res.body).toBeTruthy();
                expect(res.body).toHaveProperty('rates');
                expect(Object.keys(res.body.rates).length).toBeGreaterThan(0);
                expect(Object.values(res.body.rates)).toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        source: expect.any(String),
                        target: expect.any(String),
                        rate: expect.any(Number),
                        updated: expect.any(String),
                    }),
                ]));

                done();
            });
    });

    test('Create an exchange order', (done) => {
        const orderInput = {
            amount: 0.12345,
            source: 'eth',
            target: 'btc',
            address: '2MxRNBpiobtv9pH5NGgZHsPnb8boM43wzH6',
        };
        request(app.getHttpServer())
            .post('/v1/exchange/OrderCreate')
            .send(orderInput)
            .expect(200)
            .expect('Content-Type', /application\/json/)
            .end((err, res) => {
                expect(err).toBeFalsy();
                expect(res.body).toBeTruthy();
                expect(() => order = new OrderDto(res.body)).not.toThrow();
                expect(order).toMatchObject({
                    id: expect.any(String),
                    rate: expect.any(Number),
                    amount: orderInput.amount,
                    source: expect.objectContaining({
                        currency: orderInput.source,
                        address: expect.any(String),
                    }),
                    target: orderInput.target,
                    address: orderInput.address,
                    status: 'pending',
                    updated: expect.any(String),
                });
                done();
            });
    });

    test('Make deposit', async (done) => {
        const tx = await sendEth(ethKey, order.source.address, order.amount);
        await tx.wait(2);
        setTimeout(done, 2000);
    }, 100 * 1000);

    test('Get exchange order status', (done) => {
        request(app.getHttpServer())
            .post('/v1/exchange/OrderStatus')
            .send({ id: order.id })
            .expect(200)
            .expect('Content-Type', /application\/json/)
            .end((err, res) => {
                expect(err).toBeFalsy();
                expect(res.body).toBeTruthy();
                expect(parseFloat(res.body.rate)).toBeCloseTo(order.rate);
                expect(res.body).toMatchObject({
                    id: order.id,
                    amount: order.amount.toString(),
                    source: expect.objectContaining({
                        currency: order.source.currency,
                        address: order.source.address,
                    }),
                    target: order.target,
                    address: order.address,
                    status: 'done',
                    updated: expect.any(String),
                });
                done();
            });
    });

    afterAll(async (done) => {
        await app.close();
        done();
    });
});
