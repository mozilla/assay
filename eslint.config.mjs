import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import-x";
import prettierPlugin from "eslint-plugin-prettier";

export default [
  {
    ignores: ["out/**", "dist/**", "coverage/**", "**/*.d.ts", "**/*.js"],
  },
  js.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 6,
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "import-x": importPlugin,
      prettier: prettierPlugin,
    },
    settings: {
      "import-x/parsers": {
        "@typescript-eslint/parser": [".ts"],
      },
      "import-x/resolver": {
        node: {
          extensions: [".ts", ".js"],
        },
      },
    },
    rules: {
      ...tsPlugin.configs["eslint-recommended"].overrides[0].rules,
      ...tsPlugin.configs.recommended.rules,
      ...importPlugin.flatConfigs.recommended.rules,
      ...importPlugin.flatConfigs.typescript.rules,
      // Kept at "warn" to match the severity under @typescript-eslint v5.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/naming-convention": [
        "warn",
        {
          selector: "typeLike",
          format: ["PascalCase", "camelCase"],
        },
      ],
      "import-x/no-unresolved": [
        "error",
        {
          ignore: ["vscode"],
        },
      ],
      curly: "warn",
      eqeqeq: "warn",
      "no-throw-literal": "warn",
      semi: "off",
      "import-x/order": [
        "error",
        {
          groups: [
            ["builtin", "external"],
            "internal",
            ["parent", "sibling", "index"],
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
    },
  },
];
