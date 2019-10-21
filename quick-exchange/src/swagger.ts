import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ExchangeApiModule } from '~exchange-api/exchange-api.module';
import { PrivateApiModule } from '~private-api/private-api.module';

export function connectSwagger(app: INestApplication, prefix?: string) {
    const pubOptions = new DocumentBuilder()
        .setTitle('ZPay exchange API')
        .setContactEmail('randomnerd@icloud.com')
        .setSchemes('http', 'https')
        .addTag('exchange', 'Exchange operations');
    if (prefix) pubOptions.setBasePath(prefix);
    const publicApi = SwaggerModule.createDocument(app, pubOptions.build(), {
        include: [ ExchangeApiModule ],
    });
    SwaggerModule.setup('api', app, publicApi, {
        customSiteTitle: 'ZPay exchange API',
    });

    const privOptions = new DocumentBuilder()
        .setTitle('ZPay exchange private API')
        .setContactEmail('randomnerd@icloud.com')
        .setSchemes('http', 'https')
        .addTag('private', 'Private exchange operations');
    if (prefix) privOptions.setBasePath(prefix);
    const privateApi = SwaggerModule.createDocument(app, privOptions.build(), {
        include: [ PrivateApiModule ],
    });
    // TODO: protect the URL from public access somehow
    SwaggerModule.setup('private-api', app, privateApi, {
        customSiteTitle: 'ZPay exchange private API',
    });
}
