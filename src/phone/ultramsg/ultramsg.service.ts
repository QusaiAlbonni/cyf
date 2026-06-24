import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsappService } from '../whatsapp.service';
import axios from 'axios';
import qs from 'qs';
const ultramsg = require('ultramsg-whatsapp-api');

@Injectable()
export class UltraMsgService implements WhatsappService {
  private instanceId: string;
  private token: string;
  private client: any;

  constructor(configService: ConfigService) {
    this.instanceId = configService.get<string>('ULTRAMSG_INSTANCEID') || '';
    this.token = configService.get<string>('ULTRAMSG_TOKEN') || '';
    this.client = new ultramsg(this.instanceId, this.token);
  }

  public async sendMessage(phone: string, message: string): Promise<any> {
    phone = this.rawPhoneNumber(phone);
    const to = phone;
    const body = message;
    const response = await this.client.sendChatMessage(to, body);
    return response;
  }

  async sendAxios(phone: string, message: string) {
    const data = qs.stringify({
      token: `${this.token}`,
      to: phone,
      body: message,
    });

    const config = {
      method: 'post',
      url: `https://api.ultramsg.com/${this.instanceId}/messages/chat`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: data,
    };

    return await axios(config);
  }

  rawPhoneNumber(phone: string) {
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    return formattedPhone;
  }
}
