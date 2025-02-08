import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
        languageOptions: {
            globals: {
                ...globals.serviceworker,
                ...globals.browser,
            },
        },
        rules: {
            "react/react-in-jsx-scope": "off",
            "react/prop-types": 0,
            "no-cond-assign": ["error", "always"],
            "no-return-assign": ["error", "always"],
            "no-restricted-syntax": ["error", "always"],
            "@typescript-eslint/no-unused-vars": ["warn"],
            "@typescript-eslint/interface-name-prefix": "off",
        },
    },
];
