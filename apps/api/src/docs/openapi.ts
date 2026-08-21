export const openapiSpec = {
    openapi: "3.0.3",
    info: {
        title: "dipantauin API",
        version: "1.0.0",
        description: "API for Dipantauin price tracker",
    },
    servers: [
        {
            url: "http://localhost:3001",
        },
    ],
    paths: {
        "/api/health": {
            get: {
                summary: "Health check",
                responses: {
                    "200": {
                        description: "API is healthy",
                    },
                },
            },
        },
    },
};