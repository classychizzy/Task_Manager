//create a repository class for user
import { Repository } from "typeorm";

import AppDataSource from "../ormconfig";
import { User_entity } from "../entities/user_entity";

// export class UserRepository extends Repository<User_entity> {
//     constructor() {
//         super(User_entity, AppDataSource.manager);
//     }
// }

export const UserRepository = AppDataSource.getRepository(User_entity).extend({
    // You can add your custom repository methods here. For example:
    /*
    findById(id: number) {
        return this.findOneBy({ user_id: id });
    }
    */
});