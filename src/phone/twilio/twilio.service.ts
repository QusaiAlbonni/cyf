import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { SmsService } from '../sms.service';
import { WhatsappService } from '../whatsapp.service';

@Injectable()
export class TwilioService implements SmsService, WhatsappService {
  private twilio: Twilio;
  private sender: string;

  constructor(configService: ConfigService) {
    const accountSid = configService.get<string>('TWILIO_ACCOUNT_SID') || '';
    const authToken = configService.get<string>('TWILIO_AUTH_TOKEN') || '';
    const sender = configService.get<string>('TWILIO_PHONE_NUMBER') || '';

    this.twilio = new Twilio(accountSid, authToken);
    this.sender = sender;
  }

  async sendSms(phone: string, content: string) {
    phone = this.rawPhoneNumber(phone);
    const message = await this.twilio.messages.create({
      to: phone,
      from: this.sender,
      body: content,
    });
    return message;
  }

  rawPhoneNumber(phone: string) {
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    return formattedPhone;
  }

  public async sendMessage(phone: string, message: string): Promise<any> {
    try {
      const formattedPhone = this.rawPhoneNumber(phone);
      const whatsappFrom = `whatsapp:${this.sender}`;
      const whatsappTo = `whatsapp:${formattedPhone}`;

      const result = await this.twilio.messages.create({
        from: whatsappFrom,
        to: whatsappTo,
        body: message,
      });

      return result;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to send WhatsApp message',
        error.message,
      );
    }
  }
}
