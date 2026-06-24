/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments
} from 'class-validator';

@ValidatorConstraint({ name: 'IsStartBeforeEndDynamic', async: false })
export class IsStartBeforeEndConstraint implements ValidatorConstraintInterface {
  validate(object: any, args: ValidationArguments): boolean {
    const [startField, endField] = args.constraints;
    const start = object[startField];
    const end = object[endField];

    if (!start || !end) return true;

    const startDate = new Date(start);
    const endDate = new Date(end);

    return startDate < endDate;
  }

  defaultMessage(args: ValidationArguments): string {
    const [startField, endField] = args.constraints;
    return `${startField} must be before ${endField}`;
  }
}