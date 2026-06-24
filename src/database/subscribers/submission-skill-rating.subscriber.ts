import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { SubmissionSkillRating } from '../entities/submission-skill-rating.entity';

@EventSubscriber()
export class SubmissionSkillRatingSubscriber
  implements EntitySubscriberInterface<SubmissionSkillRating>
{
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return SubmissionSkillRating;
  }

  async afterInsert(event: InsertEvent<SubmissionSkillRating>) {
    await this.recomputeStudentAverage(event, event.entity.studentId);
  }

  async afterUpdate(event: UpdateEvent<SubmissionSkillRating>) {
    const oldStudentId = this.getStudentId(event.databaseEntity);
    const newStudentId = this.getStudentId(event.entity) ?? oldStudentId;

    if (oldStudentId) {
      await this.recomputeStudentAverage(event, oldStudentId);
    }

    if (newStudentId && newStudentId !== oldStudentId) {
      await this.recomputeStudentAverage(event, newStudentId);
    }
  }

  async afterRemove(event: RemoveEvent<SubmissionSkillRating>) {
    const studentId =
      this.getStudentId(event.entity) ??
      this.getStudentId(event.databaseEntity);

    if (studentId) {
      await this.recomputeStudentAverage(event, studentId);
    }
  }

  private async recomputeStudentAverage(
    event:
      | InsertEvent<SubmissionSkillRating>
      | UpdateEvent<SubmissionSkillRating>
      | RemoveEvent<SubmissionSkillRating>,
    studentId: number,
  ) {
    await event.manager.query(
      `
        UPDATE users
        SET average_rating = COALESCE(
          (
            SELECT ROUND(AVG(rating)::numeric, 2)
            FROM submission_skill_ratings
            WHERE student_id = $1
          ),
          0
        )
        WHERE id = $1
      `,
      [studentId],
    );
  }

  private getStudentId(entity: unknown): number | undefined {
    if (!entity || typeof entity !== 'object' || !('studentId' in entity)) {
      return undefined;
    }

    const { studentId } = entity as { studentId?: unknown };
    return typeof studentId === 'number' ? studentId : undefined;
  }
}
