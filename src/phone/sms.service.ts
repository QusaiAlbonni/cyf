export abstract class SmsService {
  abstract sendSms(phone: string, content: string): Promise<any>;
}