
import { Comment_Entity } from './comments_entity';
import { Project_entity } from './projects_entity';
import { Task_assignment_entity } from './Task_assignment_entity';
import { Task_entity } from './task_entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';




@Entity()
export class User_entity {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({type: 'varchar', length: 100})
  firstName: string;

  @Column({type: 'varchar', length: 100})
  lastName: string;

  @Column({type: 'varchar', length: 50})
  username: string;

  @Column({type: 'varchar', length: 255, unique: true})
  email: string;

  @Column({type: 'varchar', length: 255})
  password: string;

  @Column({type: 'boolean', default: true})
  isActive: boolean;

  @Column({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP'})
  created_at: Date;

  @Column({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
  updated_at: Date;

  //relationships
  @OneToMany(() => Project_entity, (project) => project.user)
  projects: Project_entity[];

  @OneToMany(() => Task_entity, (task) => task.User)
  tasks: Task_entity[];

  @OneToMany(() => Comment_Entity, (comment) => comment.user)
  comments: Comment_Entity[];

  @OneToMany(() => Task_assignment_entity, (task_assignment) => task_assignment.user)
  task_assignments: Task_assignment_entity[];


}

