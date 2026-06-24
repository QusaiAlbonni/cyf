import { registerDecorator, ValidationOptions } from "class-validator";
import { IsUniqueConstraint } from "./is-unique-constraint";
export type IsUniqueConstraintInput = {
  tableName: string;
  column: string;
};
export function IsUnique(options:IsUniqueConstraintInput,
  validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [options],
      validator: IsUniqueConstraint,
    });
  };
}