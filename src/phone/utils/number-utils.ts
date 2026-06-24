import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function getCountryFromPhoneNumber(phoneNumber: string) {
    const parsedNumber = parsePhoneNumberFromString(phoneNumber);
    return parsedNumber ? parsedNumber.country : null;
}
