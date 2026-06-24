import {
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { NotProfaneValidator } from '../validator';

export function IsNotProfane(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotProfane',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: NotProfaneValidator,
    });
  };
}
