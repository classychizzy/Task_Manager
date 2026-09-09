
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { TaskPermission } from "../enums/Taskpermission_enum";
import { Task_entity } from "./task_entity";
import { User_entity } from "./user_entity";


@Entity({ name: 'task_assignments', schema: 'public' })
export class Task_assignment_entity {
    @PrimaryGeneratedColumn()
    task_assignment_id: number;

    @Column({ type: 'enum', enum: TaskPermission, default: TaskPermission.VIEW })
    permission: TaskPermission;


    @Column({ type: 'int' })
    user_id: number; //foreign key supports the many users being assigned to a task and being represented in a table

    @Column({ type: 'int' })
    task_id: number; //foreign key supports the many users assigned to a task 
    // and the task is user is assigned to being represented in the task assignment table


    @Column({ type: 'boolean', default: false, nullable: true })
    is_deleted: boolean;


    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date

    //relationship
    @ManyToOne(() => User_entity, (user) => user.task_assignments, { nullable: false })
    @JoinColumn({ name: "user_id", })
    user: User_entity;


    @ManyToOne(() => Task_entity, (task) => task.task_assignments, { nullable: false })
    @JoinColumn({ name: "task_id" })
    task: Task_entity;
}