import PinoHttp from 'pino-http';

export const loggerOptions = {
    prettyPrint: {
        translateTime: true,
        timestampKey: 'time',
        levelFirst: true,
        ignore: 'hostname',
    },
    serializers: {
        res(res) {
            // the default
            return { statusCode: res.statusCode };
        },
        req(req) {
            return {
                method: req.method,
                url: req.url,
                path: req.path,
                parameters: req.parameters,
                headers: req.headers,
            };
        },
    },
};

export const expressLogger = PinoHttp(loggerOptions);
