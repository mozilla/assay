import * as fs from "fs";
import * as path from "path";

import { getExtensionStoragePath } from "../config/globals";

/***
 * The cache folder is stored at
 * ../Code/User/globalStorage/mozilla.assay/.cache
 * Upon initialization, the extension folder, mozilla.assay,
 * may not exist. This function creates that folder and the cache folder
 * if they do not exist.
 *
 * The folder mozilla.assay will continue to exist after this.
 */
export async function addToCache(
  addonGUID: string,
  keys: string[],
  value: string | undefined
) {
  const storagePath = getExtensionStoragePath();

  const cacheFolderPath = path.join(storagePath, ".cache");
  const cacheFilePath = path.join(cacheFolderPath, `${addonGUID}.json`);

  if (!fs.existsSync(storagePath)) {
    await fs.promises.mkdir(storagePath);
  }

  if (!fs.existsSync(cacheFolderPath)) {
    await fs.promises.mkdir(cacheFolderPath);
  }

  let cacheFileJSON: any = {};
  try {
    const cacheFile = await fs.promises.readFile(cacheFilePath, "utf-8");
    cacheFileJSON = JSON.parse(cacheFile);
  } catch (err) {
    console.log("No cache file found");
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

  removeEmptyObjectsFromCache(levelObjects);

  await fs.promises.writeFile(
    cacheFilePath,
    JSON.stringify(cacheFileJSON, null, 2)
  );
}

// Upon removing comments, we need to remove empty objects from the cache
// so that our file tree indicators are correct
export function removeEmptyObjectsFromCache(levelObjects: any[]) {
  while (levelObjects.length > 0) {
    const levelObject = levelObjects.pop();
    const [parentObject, key] = levelObject;
    if (parentObject && Object.keys(parentObject[key]).length === 0) {
      delete parentObject[key];
    }
  }
}

export async function getFromCache(addonGUID: string, keys: string[]) {
  const storagePath = getExtensionStoragePath();
  const cacheFolderPath = path.join(storagePath, ".cache");
  const cacheFilePath = path.join(cacheFolderPath, `${addonGUID}.json`);

  if (!fs.existsSync(cacheFilePath)) {
    return;
  }

  const cacheFile = await fs.promises.readFile(cacheFilePath, "utf-8");
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

export async function clearCache(storagePath: string) {
  const cacheFolderPath = path.join(storagePath, ".cache");
  if (fs.existsSync(cacheFolderPath)) {
    await fs.promises.rm(cacheFolderPath, { recursive: true });
    return true;
  }
}
