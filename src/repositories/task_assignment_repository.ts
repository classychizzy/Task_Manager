import { Repository } from "typeorm";
import AppDataSource from "../ormconfig";
import { Task_assignment_entity } from "../entities/Task_assignment_entity";


export const Task_assignment_Repository = AppDataSource.getRepository(Task_assignment_entity).extend({});
