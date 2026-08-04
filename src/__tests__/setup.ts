import AppDataSource from '../ormconfig';
import * as dotenv from 'dotenv';
import * as cron from 'node-cron';
import { TestDbHelper } from './helpers/db.helper';
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

// Clean up database between tests
afterEach(async () => {
    // Globally clear the database between tests to ensure test isolation
    await TestDbHelper.clearDatabase();
});
