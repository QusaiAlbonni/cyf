import {
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { AllowedCountriesPhoneValidator } from './allowed-countries.validator';
import { CountryCode } from 'libphonenumber-js';

export function IsPhoneFromCountries(
  countries: CountryCode[],
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPhoneFromCountries',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [countries],
      validator: AllowedCountriesPhoneValidator,
    });
  };
}
