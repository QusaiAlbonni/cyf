export type LocalizedString =
  | string
  | {
      key: string;
      args?: Record<string, any>;
    };