import * as fs from "fs";
import * as path from "path";

export async function addonInfoToCache(
  storagePath: string,
  addonGUID: string,
  reviewURL: string
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
    fs.writeFileSync(cacheFilePath, JSON.stringify({ reviewURL }));
  } else {
    const cacheFile = fs.readFileSync(cacheFilePath, "utf-8");
    const cacheFileJSON = JSON.parse(cacheFile);
    cacheFileJSON.reviewURL = reviewURL;
    fs.writeFileSync(cacheFilePath, JSON.stringify(cacheFileJSON));
  }

  console.log("\nAddon info cached at " + cacheFilePath);
}
