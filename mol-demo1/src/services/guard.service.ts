import jwt from 'jsonwebtoken';
import { Errors, ServiceSchema, Context, Service } from 'moleculer';
const { MoleculerClientError } = Errors;
import { schema } from 'ts-transformer-json-schema';

// FIXME: wtf
const JWT_SECRET = 'moleculer';

export interface ICheck {
    token: string;
    services: string[];
}

export interface IGenerate {
    service: string;
}

const ServiceGuard: ServiceSchema = {
    name: 'guard',
    actions: {
        check: {
            params: schema<ICheck>(),
            cache: true,
            handler({ params: { token, services } }: Context<ICheck>) {
                return this.verifyJWT(token, services);
            },
        },
        generate: {
            params: schema<IGenerate>(),
            handler({ params: { service } }: Context<IGenerate>) {
                this.logger.warn('Only for development!');
                return this.generateJWT(service);
            },
        },
    },
    methods: {
        /**
         * Generate a JWT token for services
         */
        generateJWT(service: string) {
            return new this.Promise((resolve, reject) => {
                return jwt.sign({ service }, JWT_SECRET, (err: Error | null, token: string) => {
                    if (err) {
                        this.logger.warn('JWT token generation error:', err);
                        return reject(
                            new MoleculerClientError('Unable to generate token', 500, 'UNABLE_GENERATE_TOKEN')
                        );
                    }
                    resolve(token);
                });
            });
        },

        /**
         * Verify a JWT token and check the service name in payload
         */
        verifyJWT(token: string, services: string[] = []): Promise<Error | null> {
            return new this.Promise(resolve => {
                jwt.verify(token, JWT_SECRET, (err: Error | null, decoded: { service: string }) => {
                    if (err) {
                        this.logger.warn('JWT verifying error:', err);
                        return resolve(new MoleculerClientError('Invalid token', 401, 'INVALID_TOKEN'));
                    }
                    if (!services.includes(decoded.service)) {
                        this.logger.warn('Forbidden service!');
                        return resolve(
                            new MoleculerClientError('Forbidden ' + decoded.service, 401, 'FORBIDDEN_SERVICE')
                        );
                    }
                    resolve(null);
                });
            });
        },
    },
};
export default ServiceGuard;
