import AppDataSource from '../ormconfig';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

// Setup runs before all tests
beforeAll(async () => {
    //verify the database is connected
    if (process.env.NODE_ENV !== 'test') {
        throw new Error('Not in test environment');
    }
    console.log('Database connected:', process.env.NODE_ENV);

    // Initialize test database connection
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }
});

// Cleanup runs after all tests
afterAll(async () => {
    // Close database connection
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }
});

// Clean up database between tests (optional but recommended)
afterEach(async () => {
    // You can add cleanup logic here if needed
    // For example, clearing specific tables between tests
});
