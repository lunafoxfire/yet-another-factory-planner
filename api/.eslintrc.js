/* eslint-disable @typescript-eslint/no-unused-vars */
const OFF = 0;
const WARN = 1;
const ERROR = 2;

module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    "overrides": [
        {
            "env": {
                "node": true
            },
            "files": [
                ".eslintrc.{js,cjs}"
            ],
            "parserOptions": {
                "sourceType": "script"
            }
        }
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "rules": {
        "@typescript-eslint/semi": [ERROR, "always"],
        "@typescript-eslint/quotes": [ERROR, "double"],
        "@typescript-eslint/no-non-null-assertion": OFF,
        "@typescript-eslint/no-explicit-any": OFF,
        "@typescript-eslint/ban-types": [
            ERROR,
            {
                extendDefaults: true,
                types: {
                    "{}": false,
                },
            },
        ],
        "@typescript-eslint/consistent-type-imports": [
            ERROR,
            {
                prefer: "type-imports",
                disallowTypeAnnotations: true,
                fixStyle: "separate-type-imports",
            },
        ],
    }
};
