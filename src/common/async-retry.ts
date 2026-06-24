import retryLib, { Options as RetryOptions } from 'async-retry';

export interface RetryDecoratorOptions {
  retries?: number;
  factor?: number;
  minTimeout?: number;
  maxTimeout?: number;
  randomize?: boolean;
  onRetry?(error: any, attempt: number): void;
  retryIf?(error: any): boolean;
}

/**
 * Core retry‐wrapper: runs `operation()` with retry semantics.
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  opts: RetryDecoratorOptions = {}
): Promise<T> {
  const {
    retries = 5,
    factor = 2,
    minTimeout = 1000,
    maxTimeout = 5000,
    randomize = true,
    onRetry,
    retryIf = () => true,
  } = opts;

  const asyncOpts: RetryOptions = {
    retries,
    factor,
    minTimeout,
    maxTimeout,
    randomize,
    onRetry(err, attempt) {
      onRetry?.(err, attempt);
    },
  };

  return retryLib(async (bail) => {
    try {
      return await operation();
    } catch (err) {
      if (!retryIf(err)) {
        bail(err);
        return undefined as never;
      }
      throw err;
    }
  }, asyncOpts);
}
export function Retry(opts: RetryDecoratorOptions = {}): MethodDecorator {
  return function <
    T extends (...args: any[]) => any
  >(
    _target: object,
    _propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>
  ): void {
    if (!descriptor.value) return;

    const originalMethod = descriptor.value;

    descriptor.value = (function (
      this: ThisParameterType<T>,
      ...args: Parameters<T>
    ) {
      // wrap the original method in retryOperation:
      return retryOperation(
        () => originalMethod.apply(this, args) as Promise<ReturnType<T>>,
        opts
      ) as ReturnType<T>;
    }) as T;
  } as any;
}
