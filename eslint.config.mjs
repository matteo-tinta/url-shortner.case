import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import unusedImports from "eslint-plugin-unused-imports";

export default [
    {
        ignores: [
            "**/node_modules/**",
            "**/dist/**",
            "**/coverage/**",
            "**/.turbo/**",
            "**/generated/**"
        ]
    },
    {
        files: ["**/*.ts"],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: "latest",
            sourceType: "module"
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
            "unused-imports": unusedImports
        },
        rules: {
            "no-unused-vars": [
                "error",
                {
                    vars: "all",
                    varsIgnorePattern: "^_",
                    args: "after-used",
                    argsIgnorePattern: "^_",
                    ignoreRestSiblings: true
                }
            ],
            "@typescript-eslint/no-unused-vars": "off",
            "unused-imports/no-unused-imports": "error",
            "unused-imports/no-unused-vars": "off"
        }
    }
];
