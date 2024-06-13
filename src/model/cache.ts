import * as fs from "fs";
import * as path from "path";

export class AssayCache {
  cacheFolderPath: string;
  cacheFilePath: string;
  constructor(public cacheName: string, public storagePath: string){
    this.cacheFolderPath = path.join(storagePath, ".cache");
    this.cacheFilePath = path.join(this.cacheFolderPath, `${cacheName}.json`);
  }

  /**
   * Adds a value to keys in cache cacheName.
   * If an empty string is passed to value, the value at key(s) is deleted from cache.
   * @param keys The key(s) of the value.
   * @param value The value to store at key(s).
   */
  // Caches are stored at
  // ../Code/User/globalStorage/mozilla.assay/<cacheName>.cache
  // Upon initialization, the extension folder, mozilla.assay,
  // may not exist. This function creates that folder and the cache folder
  // if they do not exist.
  // The folder mozilla.assay will continue to exist after this.
  async addToCache(
    keys: string[],
    value: any
  ) {

    if (!fs.existsSync(this.cacheFolderPath)) {
      await fs.promises.mkdir(this.cacheFolderPath, { recursive: true });
    }

    let cacheFileJSON: any = {};
    try {
      const cacheFile = await fs.promises.readFile(this.cacheFilePath, "utf-8");
      cacheFileJSON = JSON.parse(cacheFile);
    } catch (err) {
      console.error("No cache file found");
    }

    let currentLevel = cacheFileJSON;
    const levelObjects = [];

    for (const key of keys.slice(0, -1)) {
      levelObjects.push([currentLevel, key]);
      currentLevel = currentLevel[key] = currentLevel[key] || {};
    }

    if (!value) {
      delete currentLevel[keys[keys.length - 1]];
    } else {
      currentLevel[keys[keys.length - 1]] = value;
    }

    this.removeEmptyObjectsFromCache(levelObjects);

    await fs.promises.writeFile(
      this.cacheFilePath,
      JSON.stringify(cacheFileJSON, null, 2)
    );
  }

  /**
   * Removes a value at keys in cache cacheName.
   * @param keys The key(s) of the value.
   */
  async removeFromCache(keys: string[]){
    await this.addToCache(keys, "");
  }

  /**
   * 
   * @param keys The key(s) of the value.
   * @returns the value stored at key(s).
   */
  async getFromCache(keys: string[] = []) {

    if (!fs.existsSync(this.cacheFilePath)) {
      return;
    }

    const cacheFile = await fs.promises.readFile(this.cacheFilePath, "utf-8");
    const cacheFileJSON = JSON.parse(cacheFile);

    let currentLevel = cacheFileJSON;
    for (const key of keys) {
      if (!(key in currentLevel)) {
        return;
      }
      currentLevel = currentLevel[key];
    }
    return currentLevel;
  }

  /**
   * Clears the cache.
   * @returns whether the cache was cleared or not.
   */
  async clearCache() {
    if (fs.existsSync(this.cacheFolderPath)) {
      await fs.promises.rm(this.cacheFolderPath, { recursive: true });
      return true;
    }
    return false;
  }

  /**
   * Upon removing comments, we need to remove empty objects from the cache
   * so that our file tree indicators are correct.
   * @param levelObjects 
   */
  private removeEmptyObjectsFromCache(levelObjects: any[]) {
    while (levelObjects.length > 0) {
      const levelObject = levelObjects.pop();
      const [parentObject, key] = levelObject;
      if (parentObject && Object.keys(parentObject[key]).length === 0) {
        delete parentObject[key];
      }
    }
  }

}