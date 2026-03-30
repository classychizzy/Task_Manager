import pino from 'pino';


const streams: any[] = [
    {
        target: 'pino-pretty',
        level: process.env.LOG_LEVEL || 'info',
        options: {
            colorize: true,
        },
    },
];

if (process.env.LOG_FILE) {
    streams.push({
        target: 'pino/file',
        level: process.env.LOG_LEVEL || 'info',
        options: { destination: process.env.LOG_FILE, mkdir: true },
    });
}

export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    // this logs everything in the request header, i need something simple 
    //redact: [
    //     'req.headers.authorization',
    //     'res.headers.authorization',
    //     'req.body.password',
    //     'res.body.password',
    // ],
    serializers: {
        req: (req) => ({
            userId: req.user?.id,
            method: req.method,
            url: req.url,
            // nothing else gets through
        }),
        res: (res) => ({
            statusCode: res.statusCode,

        })
    },
    // pino pretty, this doesn't work well with serializers
    // transport: {
    //     targets: streams,
    // },
});

