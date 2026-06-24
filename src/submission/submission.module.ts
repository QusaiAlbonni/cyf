import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Submission,
  SubmissionLink,
  SubmissionSkillRating,
  Task,
  TaskSkill,
} from '../database/entities';
import { SubmissionController } from './submission.controller';
import { SubmissionService } from './submission.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Submission,
      SubmissionLink,
      SubmissionSkillRating,
      Task,
      TaskSkill,
    ]),
  ],
  controllers: [SubmissionController],
  providers: [SubmissionService],
  exports: [SubmissionService],
})
export class SubmissionModule {}
