/**
 * Store definition
 */
export interface ShorturlStore {
  getUrlById(options: { shortId: string }): Promise<{ fullUrl: string }>;

  getIdByUrl(options: { fullUrl: string }): Promise<{ shortId: string }>;

  saveUrlMapping(options: {
    shortId: string;
    fullUrl: string;
    usageCount: number;
  }): Promise<void>;

  getAllRecords(): Promise<
    [{ shortId: string; fullUrl: string; usageCount: number }]
  >;
}
