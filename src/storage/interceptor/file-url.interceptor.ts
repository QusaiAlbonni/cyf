import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { from, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { StorageService } from '../storage.service';

const MARK = Symbol('marked');

function mark<T extends object>(obj: T): void {
  (obj as any)[MARK] = true;
}

function isMarked(obj: object): boolean {
  return (obj as any)[MARK] === true;
}

@Injectable()
export class FileUrlInterceptor implements NestInterceptor {
  constructor(private readonly fileUrlService: StorageService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const host = `${request.protocol}://${request.get('host')}`;
    return next.handle().pipe(
      mergeMap((data) => {
        if (typeof data !== 'object' || data instanceof StreamableFile)
          return of(data);
        if (!data || isMarked(data)) return from(Promise.resolve(data));
        const result = from(this.transformDataAsync(data, host));
        mark(data);
        return result;
      }),
    );
  }

  async transformDataAsync(data: any, host: string): Promise<any> {
    if (!data || typeof data !== 'object') return data;

    if (Array.isArray(data)) {
      return Promise.all(
        data.map((item) => this.transformDataAsync(item, host)),
      );
    }

    const proto = Object.getPrototypeOf(data);
    if (!proto) return data;

    for (const key of Object.keys(data)) {
      const isFileUrlField = Reflect.getMetadata('fileUrlField', proto, key);

      if (isFileUrlField && data[key]) {
        data[key] = await this.fileUrlService.getFileUrl(data[key], host);
      } else if (typeof data[key] === 'object' && data[key] !== null) {
        data[key] = await this.transformDataAsync(data[key], host);
      }
    }

    return data;
  }
}
