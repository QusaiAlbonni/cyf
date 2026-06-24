import { Module } from '@nestjs/common';
import { PhoneService } from './phone.service';
import { TwilioService } from './twilio/twilio.service';
import { SmsService } from './sms.service';
import { WhatsappService } from './whatsapp.service';
import { UltraMsgService } from './ultramsg/ultramsg.service';

@Module({
  providers: [
    PhoneService,
    TwilioService,
    UltraMsgService,
    { provide: SmsService, useExisting: TwilioService },
    { provide: WhatsappService, useExisting: UltraMsgService },
  ],
  exports: [PhoneService],
})
export class PhoneModule {}
