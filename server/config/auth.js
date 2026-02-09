const DEFAULT_DEV_JWT_SECRET = 'dev-only-secret-do-not-use-in-production';
const DEFAULT_DEV_ADMIN_PASSWORD = 'admin1234';

const jwtSecret = process.env.JWT_SECRET?.trim();
const adminPassword = process.env.ADMIN_PASSWORD?.trim();

if (!jwtSecret) {
    if (process.env.NODE_ENV === 'production') {
        console.error('CRITICAL: JWT_SECRET environment variable is not defined!');
        process.exit(1);
    } else {
        console.warn('WARNING: JWT_SECRET is not defined. Using a temporary secret for development.');
    }
}

export const JWT_SECRET = jwtSecret || DEFAULT_DEV_JWT_SECRET;
export const ADMIN_PASSWORD = adminPassword || DEFAULT_DEV_ADMIN_PASSWORD;
