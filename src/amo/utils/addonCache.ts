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
export async function addToCache(
  storagePath: string,
  addonGUID: string,
  key: string,
  value: string
) {
  const cacheFolderPath = path.join(storagePath, ".cache");
  const cacheFilePath = path.join(cacheFolderPath, `${addonGUID}.json`);

  if (!fs.existsSync(storagePath)) {
    await fs.promises.mkdir(storagePath);
  }

  if (!fs.existsSync(cacheFolderPath)) {
    await fs.promises.mkdir(cacheFolderPath);
  }

  let cacheFileJSON: { [key: string]: string } = {};
  try {
    const cacheFile = await fs.promises.readFile(cacheFilePath, "utf-8");
    cacheFileJSON = JSON.parse(cacheFile);
  } catch (err) {
    console.log("No cache file found");
  }
  cacheFileJSON[key] = value;
  await fs.promises.writeFile(cacheFilePath, JSON.stringify(cacheFileJSON));
}

export async function getFromCache(
  storagePath: string,
  addonGUID: string,
  key: string
) {
  const cacheFolderPath = path.join(storagePath, ".cache");
  const cacheFilePath = path.join(cacheFolderPath, `${addonGUID}.json`);

  if (!fs.existsSync(cacheFilePath)) {
    return;
  }

  const cacheFile = await fs.promises.readFile(cacheFilePath, "utf-8");
  const cacheFileJSON = JSON.parse(cacheFile);

  return cacheFileJSON[key];
}

export async function clearCache(storagePath: string) {
  const cacheFolderPath = path.join(storagePath, ".cache");
  if (fs.existsSync(cacheFolderPath)) {
    await fs.promises.rm(cacheFolderPath, { recursive: true });
    return true;
  }
}
