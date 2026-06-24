import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { User } from '../database/entities';
import { SmsService } from './sms.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { WhatsappService } from './whatsapp.service';
@Injectable()
export class PhoneService {
  constructor(
    private smsService: SmsService,
    private whatsappService: WhatsappService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}
  async sendSmsToUser(user: User, content: string): Promise<unknown> {
    const phone = user.phone;
    if (!phone) {
      throw new BadRequestException('User does not have a phone number');
    }
    return await this.sendSms(phone, content);
  }

  async sendSms(phone: string, content: string): Promise<unknown> {
    const resp: unknown = await this.sendWhatsappMessage(phone, content);
    return resp;
  }

  async sendWhatsappMessage(phone: string, content: string): Promise<unknown> {
    let resp: unknown;
    try {
      resp = await this.whatsappService.sendMessage(phone, content);
    } catch {
      this.logger.warn({
        message: 'Whatsapp Service failed',
        originalMessage: content,
      });
    }
    return resp;
  }
}
