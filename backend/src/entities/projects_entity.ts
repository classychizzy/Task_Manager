
import { User_entity } from "./user_entity";
import { Task_entity } from "./task_entity";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";


@Entity({ name: 'projects', schema: 'public'})
export class Project_entity {
    @PrimaryGeneratedColumn()
    project_id: number;

    @Column({type: 'varchar', length: 255})
    name: string;

    @Column({type: 'text', nullable: true})
    description: string;

    @Column({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP'})
    created_at: Date;

    @Column({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updated_at: Date;

    @Column({type: 'boolean', default: false}) // always set default to false to avoid errors
    is_deleted: boolean;

    @Column({type: 'timestamp', default: null, nullable: true})
    deleted_at: Date | null;



    // relationships
    @ManyToOne(() => User_entity, (user) => user.projects, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user: User_entity;

    @OneToMany(() => Task_entity, (task) => task.project)
    tasks: Task_entity[];



}