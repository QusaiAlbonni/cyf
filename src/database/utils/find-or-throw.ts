import { NotFoundException } from '@nestjs/common';
import { BaseEntity, EntityNotFoundError, FindOptionsWhere, Repository } from 'typeorm';

export async function findByPkOrThrow<T extends BaseEntity>(
  repo: Repository<T>,
  pk: FindOptionsWhere<T> | FindOptionsWhere<T>[],
  message?: string
): Promise<T> {
  try {
    const result = await repo.findOneByOrFail({ ...pk });
    return result;
  } catch (error) {
    if (error instanceof EntityNotFoundError)
      throw new NotFoundException(message);
    throw error;
  }
}
