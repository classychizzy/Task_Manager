"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// main entry point
const app_1 = __importDefault(require("./app"));
const validateEnv_1 = require("./utils/validateEnv");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
(0, validateEnv_1.validateEnv)();
const port = process.env.PORT || 8000;
const app = new app_1.default();
app.listen(Number(port));
app.app.get('/', (req, res) => {
    res.send('Hello World!');
});
//# sourceMappingURL=server.js.map