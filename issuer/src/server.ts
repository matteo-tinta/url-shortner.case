require("dotenv").config({ path: [".env.development", ".env"] });

import app from "./app";
import { appConfigs, cleanup, initializeIssuer } from "./composition";

initializeIssuer()
    .then(() => {
        const port = appConfigs.PORT;

        console.log("Issuer service initialized successfully");

        const server = app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });

        process.on("SIGTERM", () => {
            console.log("SIGTERM received, shutting down gracefully");
            server.close(() => {
                console.log("Server closed");
                process.exit(0);
            });
        });

        process.on("SIGINT", () => {
            console.log("SIGINT received, shutting down gracefully");
            server.close(() => {
                console.log("Server closed");
                process.exit(0);
            });
        });

        server.on("error", (error) => {
            console.error("Server error:", error);
            process.exit(1);
        });

        server.on("close", async () => {
            console.log("Server is closing, cleaning up resources");
            await cleanup();
        });
    })
    .catch((error) => {
        console.error("Error initializing issuer service:", error);
        process.exit(1);
    });
