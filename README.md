![Untitled_Artwork](https://github.com/mozilla/assay/assets/63402349/19f10519-d74c-4d3e-ab7a-e9dbb5091918)

# Welcome to **Assay**!

> Assay: The testing of a metal (Addon) or ore (Addon) to determine its ingredients (functionalities) and quality (quality).

## Requirements

You certainly need [Node](https://nodejs.org/en/). Development is done with [VSCode](https://code.visualstudio.com/).


## Setup

1. Install Node
2. Clone the repository
3. Run `npm install` in the root directory

## Building the Extension
To build and package the extension, run `npm run build`. This will create a `.vsix` file in the root directory of the project.

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


