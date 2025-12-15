
import { User_entity } from './user_entity';
import { Comment_Entity } from './comments_entity';
import { Project_entity } from './projects_entity';
import { Task_assignment_entity } from './Task_assignment_entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';





@Entity()
export class Task_entity {
    @PrimaryGeneratedColumn()
    task_id: number;

    @Column({type: 'varchar', length: 255})
    title: string;

    @Column({type: 'text', nullable: true})
    description: string;

    @Column({type: 'boolean', default: false})
    status: boolean;

    @Column({type: 'timestamp', nullable: true})
    dueDate: Date;

    @Column({type: 'int', default: 1})
    priority_level: number;

    @Column({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP'})
    created_at: Date;

    @Column({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updated_at: Date;

    // relationships
    @ManyToOne(() => User_entity, (user) => user.tasks)
    User: User_entity;

    @ManyToOne(() => Project_entity, (project) => project.tasks)
    project: Project_entity;

    @OneToMany(() => Task_assignment_entity, (task_assignment) => task_assignment.task)
    task_assignments: Task_assignment_entity[];

    @OneToMany(() => Comment_Entity, (comment) => comment.task)
    comments: Comment_Entity[];
  

}

    