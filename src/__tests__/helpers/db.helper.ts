import AppDataSource from '../../ormconfig';
import { UserRepository } from '../../repositories/user_repository';
import { RefreshRepository } from '../../repositories/refresh_repository';

/**
 * Test database utilities
 */
export class TestDbHelper {
    /**
     * Clear all data from the database
     */
    static async clearDatabase() {
        const entities = AppDataSource.entityMetadatas;

        for (const entity of entities) {
            const repository = AppDataSource.getRepository(entity.name);
            await repository.query(`TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE;`);
        }
    }

    /**
     * Clear specific tables
     */
    static async clearTables(tableNames: string[]) {
        for (const tableName of tableNames) {
            await AppDataSource.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`);
        }
    }

    /**
     * Clear user-related data
     */
    static async clearUserData() {
        await RefreshRepository.delete({});
        await UserRepository.delete({});
    }
}

/**
 * Generate test user data
 */
export const generateTestUser = (overrides?: any) => ({
    firstName: 'Test',
    lastName: 'User',
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    ...overrides,
});

/**
 * Generate multiple unique test users
 */
export const generateTestUsers = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
        firstName: `Test${i}`,
        lastName: `User${i}`,
        username: `testuser${i}_${Date.now()}`,
        email: `test${i}_${Date.now()}@example.com`,
        password: 'TestPassword123!',
    }));
};
