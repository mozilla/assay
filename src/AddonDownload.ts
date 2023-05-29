import nodeFetch from 'node-fetch';
import * as fs from 'fs';

export async function downloadAddon(id: string, path: string) {
    const url = `https://addons.mozilla.org/firefox/downloads/file/${id}`;
    
    try {
      const response = await nodeFetch(url);
      
      if (response.ok) {
        console.log("writing to " + path);
        const dest = fs.createWriteStream(path, { flags: 'w' });
        dest.write(await response.buffer());
      } else {
        console.error('Request failed:', response.status);
      }	
    } catch (error) {
      console.error('An error occurred:', error);
    }
} 