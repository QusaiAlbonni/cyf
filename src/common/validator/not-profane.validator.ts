import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import profanity, { isProfane } from '../../profanity';

@ValidatorConstraint({ name: 'notProfane', async: false })
export class NotProfaneValidator implements ValidatorConstraintInterface {
  validate(text: string, args: ValidationArguments) {
    return !isProfane(text) && !profanity.exists(text);
  }

  defaultMessage(args: ValidationArguments) {
    return "The text contains inappropriate language";
  }
}
