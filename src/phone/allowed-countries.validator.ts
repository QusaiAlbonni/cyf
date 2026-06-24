import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import { getCountryFromPhoneNumber } from './utils';

@ValidatorConstraint({ name: 'allowedCountries', async: false })
export class AllowedCountriesPhoneValidator implements ValidatorConstraintInterface {
  validate(text: string, args: ValidationArguments) {
    const [countries] = args.constraints;
    const country = getCountryFromPhoneNumber(text);
    return countries.includes(country);
  }

  defaultMessage(args: ValidationArguments) {
    const [countries] = args.constraints;
    const countriesFormatted: string = countries.join(', ');
    return 'Phone ($value) must be from these countries: ' + countriesFormatted;
  }
}