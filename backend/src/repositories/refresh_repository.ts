import { Repository } from "typeorm";
import AppDataSource from "../ormconfig";
import { Refresh_entity} from "../entities/refresh_entity";


export const RefreshRepository = AppDataSource.getRepository(Refresh_entity).extend({});