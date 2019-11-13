import { Context, ServiceSchema } from 'moleculer';
import { schema } from 'ts-transformer-json-schema';

interface IUser {
    name: string;
}

const GreeterService: ServiceSchema = {
    name: 'greeter',
    authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXJ2aWNlIjoiZ3JlZXRlciIsImlhdCI6MTU3MzY0MTM4M30.HUL7lxdyox-NnZlwUSU_KdVAKNKQXYAp4yAkv05nKKo',
    settings: {},
    dependencies: [],
    actions: {
        async posts(ctx) {
            const posts = await ctx.call('posts.find', { ...ctx.params });
            this.broker.broadcast('test.posts', posts);
            return posts;
        },
        welcome: {
            params: schema<IUser>(false),
            async handler(ctx: Context<IUser>) {
                return `Welcome, ${ctx.params.name}`;
            },
        },
    },
    events: {},
    methods: {},
    // created() {},
    // async started() {},
    // async stopped() {},
};

export = GreeterService;
