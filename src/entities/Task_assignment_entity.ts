
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Task_entity } from "./task_entity";
import { User_entity } from "./user_entity";


@Entity({name: 'task_assignments', schema: 'public'})
export class Task_assignment_entity {
    @PrimaryGeneratedColumn()
    task_assignment_id: number;


    @Column()
    permission: string;

    @Column({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP'})
    created_at: Date;

    @Column({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updated_at: Date

    //relationship
    @ManyToOne(() => User_entity, (user) => user.task_assignments)
    user: User_entity;
    @JoinColumn({ name: "user_id" })
    

    @ManyToOne(() => Task_entity, (task) => task.task_assignments)
    @JoinColumn({ name: "task_id" })
    task: Task_entity;
}