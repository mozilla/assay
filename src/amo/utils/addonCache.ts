import * as fs from "fs";
import * as path from "path";

/***
 * The cache folder is stored at
 * ../Code/User/globalStorage/undefined_publisher.assay/.cache
 * Upon initialization, the extension folder, undefined_publisher.assay,
 * may not exist. This function creates that folder and the cache folder
 * if they do not exist.
 *
 * The folder undefined_publisher.assay will continue to exist after this.
 */
export async function addonInfoToCache(
  storagePath: string,
  addonGUID: string,
  key: string,
  value: string
) {
  const cacheFolderPath = path.join(storagePath, ".cache");
  const cacheFilePath = path.join(cacheFolderPath, `${addonGUID}.json`);

  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath);
  }

  if (!fs.existsSync(cacheFolderPath)) {
    fs.mkdirSync(cacheFolderPath);
  }

  if (!fs.existsSync(cacheFilePath)) {
    fs.writeFileSync(cacheFilePath, JSON.stringify({ [key]: value }));
  } else {
    const cacheFile = fs.readFileSync(cacheFilePath, "utf-8");
    const cacheFileJSON = JSON.parse(cacheFile);
    cacheFileJSON[key] = value;
    fs.writeFileSync(cacheFilePath, JSON.stringify(cacheFileJSON));
  }
}

export async function addonInfoFromCache(
  storagePath: string,
  addonGUID: string,
  key: string
) {
  const cacheFolderPath = path.join(storagePath, ".cache");
  const cacheFilePath = path.join(cacheFolderPath, `${addonGUID}.json`);

  if (!fs.existsSync(cacheFilePath)) {
    return;
  }

  const cacheFile = fs.readFileSync(cacheFilePath, "utf-8");
  const cacheFileJSON = JSON.parse(cacheFile);

  return cacheFileJSON[key];
}

export async function clearCache(storagePath: string) {
  const cacheFolderPath = path.join(storagePath, ".cache");
  if (fs.existsSync(cacheFolderPath)) {
    fs.rmSync(cacheFolderPath, { recursive: true });
    return true;
  }
}
