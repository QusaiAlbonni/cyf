import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Batch,
  Skill,
  Submission,
  Task,
  TaskRequiredLink,
  TaskSkill,
  User,
} from '../database/entities';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Batch,
      Skill,
      Submission,
      Task,
      TaskRequiredLink,
      TaskSkill,
      User,
    ]),
  ],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
