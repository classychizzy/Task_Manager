import { Repository } from "typeorm";
import AppDataSource from "../ormconfig";
import { Task_entity } from "../entities/task_entity";

export const TaskRepository = AppDataSource.getRepository(Task_entity).extend({});