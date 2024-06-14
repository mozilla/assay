import { AssayCache } from "../model/cache";
import { JSONReview } from "../types";

export class ReviewCacheController{

    constructor(private cache: AssayCache){
    }

    async addReview(guid: string, review: JSONReview){
        await this.cache.addToCache([guid], review);
    }

    async getReview(keys: string[]){
        return await this.cache.getFromCache(keys);
    }

}