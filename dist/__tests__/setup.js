"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ormconfig_1 = __importDefault(require("../ormconfig"));
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: '.env.test' });
// Setup runs before all tests
beforeAll(async () => {
    //verify the database is connected
    if (process.env.NODE_ENV !== 'test') {
        throw new Error('Not in test environment');
    }
    console.log('Database connected:', process.env.NODE_ENV);
    // Initialize test database connection
    if (!ormconfig_1.default.isInitialized) {
        await ormconfig_1.default.initialize();
    }
});
// Cleanup runs after all tests
afterAll(async () => {
    // Close database connection
    if (ormconfig_1.default.isInitialized) {
        await ormconfig_1.default.destroy();
    }
});
// Clean up database between tests (optional but recommended)
afterEach(async () => {
    // You can add cleanup logic here if needed
    // For example, clearing specific tables between tests
});
