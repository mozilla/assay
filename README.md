![Untitled_Artwork](https://github.com/mozilla/assay/assets/63402349/19f10519-d74c-4d3e-ab7a-e9dbb5091918)

# Welcome to **Assay**!

[![CircleCI](https://dl.circleci.com/status-badge/img/gh/mozilla/assay/tree/main.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/mozilla/assay/tree/main)

> Assay: The testing of a metal (Addon) or ore (Addon) to determine its ingredients (functionalities) and quality (quality).

## Requirements

You certainly need [Node](https://nodejs.org/en/) (LTS). Development is done with [VSCode](https://code.visualstudio.com/).

## Get started

1. Clone the repository
2. Run `npm install` in the root directory to install all the dependencies

Note: Any command not configured to run with a specific environment variable will run with the development constants.

## Testing the extension

The easiest way to run all the checks for this extension is to execute `npm test` in the project's root directory.

You can also run the following commands to test the extension with the different constants defined in `src/config/constants.ts`:

- `npm run test:dev`
- `npm run test:stage`
- `npm run test:prod`

## Running the extension

1. Navigate to the debug view in the sidebar of VSCode
2. From the dropdown menu beside the green play button, select one of the following options:
   - `Run Assay (Development)`
   - `Run Assay (Staging)`
   - `Run Assay (Production)`
3. Click the green play button to run the extension

Each of these options will run the extension with different constants defined in `src/config/constants.ts`.

## Building the extension

To build and package the extension (optimized/production build), run `npm run build`. This will create a `.vsix` file in the root directory of the project.

## Prettier

We use [Prettier][] to automatically format our JavaScript code and stop all the on-going debates over styles. As a developer, you have to run it (with `npm run prettier`) before submitting a Pull Request.

[prettier]: https://prettier.io/
