require('dotenv').config({ path: ['.env.development', '.env'] })

import { defineConfig, env } from "prisma/config";

export default defineConfig({
    schema: "src/persistence/prisma/schema.prisma",
    migrations: {
        path: "src/persistence/prisma/migrations",
    },
    datasource: {
        url: env("DATABASE_URL"),
    },
});