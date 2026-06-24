import {
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { IsStartBeforeEndConstraint } from '../validator';

export function IsStartBeforeEnd(
  startField: string,
  endField: string,
  validationOptions?: ValidationOptions
) {
  return function (object: any, propertyName: any) {
    registerDecorator({
      name: 'IsStartBeforeEndDynamic',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [startField, endField],
      validator: IsStartBeforeEndConstraint,
    });
  };
}