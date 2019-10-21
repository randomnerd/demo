import { ValidationError, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '~app.module';
import { ErrorType, ExchangeError } from '~exchange-api/exchange-api.dto';
import { expressLogger } from '~logger';
import { connectSwagger } from '~swagger';
if (process.env.NODE_ENV === undefined) process.env.NODE_ENV = 'development';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableShutdownHooks();
    app.setGlobalPrefix('/v1');
    app.enableCors();
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
        exceptionFactory: (errors: ValidationError[]) => {
            console.log(JSON.stringify(errors, null, 4));

            const msg = errors.map(e => Object.values(e.constraints));
            return new ExchangeError(ErrorType.InvalidRequest, msg.join('; '));
        },
    }));
    if (process.env.NODE_ENV !== 'production') app.use(expressLogger);
    connectSwagger(app, '/v1');
    await app.listen(process.env.PORT || 3000, '0.0.0.0');
}

// tslint:disable-next-line:no-console
bootstrap().catch(console.error);
