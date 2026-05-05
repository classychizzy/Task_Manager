import helmet from 'helmet';

const isProduction = process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'production';

export const helmetOptions = isProduction ? {
    hsts: { maxAge: 31536000 },
}
    : {
        contentSecurityPolicy: false,
        hsts: false,
    };