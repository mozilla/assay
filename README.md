![Untitled_Artwork](https://github.com/mozilla/assay/assets/63402349/19f10519-d74c-4d3e-ab7a-e9dbb5091918)

# Welcome to **Assay**!

> Assay: The testing of a metal (Addon) or ore (Addon) to determine its ingredients (functionalities) and quality (quality).

## Features

1. Dropdown menu inside the explore view with the ability to download an addon version using the GUID, URL, or slug of the addon.
![step 1](https://github.com/mozilla/assay/assets/63402349/23f1eb88-b35f-4955-8a20-872b3cf7e9dc)

2. Open the review page of the addon in the browser from the taskbar.
![step 2](https://github.com/mozilla/assay/assets/63402349/8c60a686-d78b-4b12-9b87-baa4418a9fc0)

3. Automatically switch focus to a different addon upon opening a file from the addon.
![step 3](https://github.com/mozilla/assay/assets/63402349/7dc374cc-403a-4f14-9c98-ad1cb9da9d56)

## Requirements

You certainly need [Node](https://nodejs.org/en/) 16.x. Development is done with [VSCode](https://code.visualstudio.com/).


## Setup

1. Install Node
2. Clone the repository
3. Run `npm install` in the root directory

## Running the Extension
1. Navigate to the debug view in the sidebar of VSCode
2. From the dropdown menu beside the green play button, select one of the following options:
    - `Run Assay (Development)`
    - `Run Assay (Staging)`
    - `Run Assay (Production)`
3. Click the green play button to run the extension

Each of these options will run the extension with different constants defined in `src/config/constants.ts`.

## Testing the Extension
- Run the following commands to test the extension with the different constants defined in `src/config/constants.ts`:
    - `npm run test:dev`
    - `npm run test:stage`
    - `npm run test:prod`

###### *Note: Any command not configured to run with a specific environment variable will run with the development constants.*

---


