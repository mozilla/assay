import { AssayCache } from "../model/cache";
import { JSONReview } from "../types";

export class ReviewCacheController{
    private cache: AssayCache;

    constructor(cacheName: string, storagePath: string){
        this.cache = new AssayCache(cacheName, storagePath);
    }

    async addReview(guid: string, review: JSONReview){
        await this.cache.addToCache([guid], review);
    }

    async getReview(keys: string[]){
        return await this.cache.getFromCache(keys);
    }

}