require('dotenv').config({ path: ['.env.development', '.env'] })

import app from "./app";
import { appConfigs } from "./composition";

const PORT = appConfigs.PORT;

const server = app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
});
