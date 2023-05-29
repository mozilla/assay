import nodeFetch from 'node-fetch';


export async function getAddonInfo(input: string) {
    if (input.includes('/')) {
        const slug = input.split('addon/')[1].split('/')[0];
        const url = `https://addons.mozilla.org/api/v5/addons/addon/${slug}`;

        try {
            return await nodeFetch(url);
        } catch (error) {
            console.error('An error occurred:', error);
        }

    } else if (input.includes('-')) {
        const slug = input;
        const url = `https://addons-dev.allizom.org/api/v5/addons/addon/${slug}`;

        try {
            return await nodeFetch(url);

        } catch (error) {
            console.error('An error occurred:', error);
        }

    } else {
        const id = input;

        try {
            // todo
        } catch (error) {
            console.error('An error occurred:', error);
        }
    }
}