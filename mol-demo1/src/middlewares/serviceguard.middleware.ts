import { ActionHandler, Middleware, ServiceSchema, Errors } from 'moleculer';

const { MoleculerClientError } = Errors;

export const ServiceGuard: ServiceSchema<Middleware> = {
    name: 'service-guard',
    // Wrap local action handlers (legacy middleware handler)
    localAction(next: ActionHandler, action) {
        const services = action.restricted || action.service.schema.restricted;
        if (!services) return next;
        return async (ctx) => {
            const { meta, caller } = ctx;
            const token = meta.$authToken;
            if (!token)
                throw new MoleculerClientError(`Service '${caller}' token is missing`, 401, 'TOKEN_MISSING');
            const error = await ctx.call('guard.check', { token, services });
            if (error) {
                throw error;
            }
            return await next(ctx);
        };
    },

    call(next) {
        return async (actionName, params, opts) => {
            if (opts.parentCtx) {
                const service = opts.parentCtx.service;
                const token = service.schema.authToken;
                if (!opts.meta) opts.meta = {};
                opts.meta.$authToken = token;
            }
            return await next(actionName, params, opts);
        };
    },
};
