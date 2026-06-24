import 'reflect-metadata';

export function FileUrlField(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    Reflect.defineMetadata('fileUrlField', true, target, propertyKey);
  };
}