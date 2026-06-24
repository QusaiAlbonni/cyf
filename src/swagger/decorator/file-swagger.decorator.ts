import { applyDecorators } from '@nestjs/common';
import {
  ApiConsumes,
  ApiBody,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  SchemaObject,
  ReferenceObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

export function ApiMultipart(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  dto?: Function,
  fileField = 'file',
  isMultipleFiles = false,
): MethodDecorator {
  const bodySchema: SchemaObject | ReferenceObject = {
    allOf: [
      {
        type: 'object',
        properties: {
          [fileField]: isMultipleFiles
            ? {
                type: 'array',
                items: {
                  type: 'string',
                  format: 'binary',
                },
              }
            : {
                type: 'string',
                format: 'binary',
              },
        },
      },
    ],
  };

  const decorators: Array<
    ClassDecorator | MethodDecorator | PropertyDecorator
  > = [ApiConsumes('multipart/form-data')];

  if (dto) {
    decorators.push(ApiExtraModels(dto));
    bodySchema.allOf?.push({ $ref: getSchemaPath(dto) });
  }

  decorators.push(ApiBody({ schema: bodySchema }));

  return applyDecorators(...decorators);
}
