export abstract class WhatsappService {
  public abstract sendMessage(phone: string, message: string): Promise<any>;
}