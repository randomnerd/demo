import moleculer, { ServiceSchema } from 'moleculer';
import { Service, Event } from 'moleculer-decorators';
import web from 'moleculer-web';

@Service({
    name: 'api',
    authToken: [
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        'eyJzZXJ2aWNlIjoidGVzdCIsImlhdCI6MTU3MzYxODMwNX0',
        'lEc1aHsw8fKeGyl2DXEdaR75zyI3UAgh3e8xFB6w9Y4',
    ].join('.'),
    mixins: [web as any],
    settings: {
        port: process.env.PORT || 3000,
        routes: [
            { path: '/api', whitelist: ['**'] },
        ],
        assets: { folder: 'public' },
    }
})
class Api extends moleculer.Service {
    @Event()
    'api.*'(payload: any, sender: string, eventName: string) {
        this.logger.info('event catched1', payload, sender, eventName);
    }
}

export const ApiService: ServiceSchema = {
    name: 'api',
    authToken: [
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        'eyJzZXJ2aWNlIjoidGVzdCIsImlhdCI6MTU3MzYxODMwNX0',
        'lEc1aHsw8fKeGyl2DXEdaR75zyI3UAgh3e8xFB6w9Y4',
    ].join('.'),
    mixins: [web],
    settings: {
        port: process.env.PORT || 3000,
        routes: [
            { path: '/api', whitelist: ['**'] },
        ],
        assets: { folder: 'public' },
    },
    actions: {},
    events: {
        'api.*'(payload: any, sender: string, eventName: string) {
            this.logger.info('event catched1', payload, sender, eventName);
        },
    },
};
export default Api;
