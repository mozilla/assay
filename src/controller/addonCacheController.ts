import { AssayCache } from "../model/assayCache";
import { JSONReview } from "../types";

export class AddonCacheController {
  constructor(private cache: AssayCache) {}

  /**
   * Add an add-on's metadata to cache.
   * @param guid The GUID of the add-on.
   * @param review The review.
   */
  async addAddonToCache(guid: string, review: JSONReview) {
    await this.cache.addToCache([guid], review);
  }

  /**
   * Fetch an add-on's metadata from cache.
   * @param keys
   * @returns The metadata located at keys.
   */
  async getAddonFromCache(keys: string[]) {
    return await this.cache.getFromCache(keys);
  }
}
