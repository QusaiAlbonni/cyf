export interface StoredFile extends Express.Multer.File {
  storageKey?: string;
}
