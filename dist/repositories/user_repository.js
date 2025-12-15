"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const ormconfig_1 = __importDefault(require("../ormconfig"));
const user_entity_1 = require("../entities/user_entity");
// export class UserRepository extends Repository<User_entity> {
//     constructor() {
//         super(User_entity, AppDataSource.manager);
//     }
// }
exports.UserRepository = ormconfig_1.default.getRepository(user_entity_1.User_entity).extend({
// You can add your custom repository methods here. For example:
/*
findById(id: number) {
    return this.findOneBy({ user_id: id });
}
*/
});
