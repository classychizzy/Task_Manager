import AppDataSource from '../ormconfig';

// Setup runs before all tests
beforeAll(async () => {
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
