import { AssayCache } from "../model/assayCache";
import { JSONReview } from "../types";

export class AddonCacheController {
  constructor(private cache: AssayCache) {}

  /**
   * Add an add-on's metadata to cache.
   * @param guid The GUID of the add-on.
   * @param review The review.
   */
  async addAddonToCache(guid: string, rawReviewMeta: JSONReview) {
    const existingVersions =
      (await this.cache.getFromCache([guid, "fileIDs"])) || {};
    const { version, fileID, ...reviewMeta } = rawReviewMeta;
    existingVersions[version] = fileID;

    await this.cache.addToCache([guid], {
      ...reviewMeta,
      fileIDs: existingVersions,
    });
  }

  /**
   * Fetch an add-on's metadata from cache.
   * @param keys
   * @returns The metadata located at keys.
   */
  async getAddonFromCache(keys: string[]) {
    return await this.cache.getFromCache(keys);
  }

  /**
   * Check if guid, version is dirtied.
   */
  async isDirty(guid: string, version: string) {
    return await this.cache.getFromCache([guid, version, "isDirty"]);
  }

  /**
   * Set guid, version to dirtied.
   */
  async setVersionAsDirty(guid: string, version: string) {
    this.cache.addToCache([guid, version, "isDirty"], true);
  }
}
