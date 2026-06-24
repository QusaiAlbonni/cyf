import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthEventType } from '../models/auth.events';

@Injectable()
export class AuthEventEmitter {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async emit(eventType: AuthEventType, payload: any) {
    return this.eventEmitter.emit(eventType, payload);
  }
}
