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
    redact: [
        'req.headers.authorization',
        'res.headers.authorization',
        'req.body.password',
        'res.body.password',
    ],
    transport: {
        targets: streams,
    },
});

