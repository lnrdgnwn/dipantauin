export const openapiSpec = {
    openapi: "3.0.3",
    info: {
        title: "Dipantauin API",
        version: "1.0.0",
        description: "API backend for Dipantauin (Express.js, Prisma)",
    },
    servers: [
        {
            url: "http://localhost:3001",
            description: "Development Server"
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT"
            }
        }
    },
    security: [
        {
            bearerAuth: []
        }
    ],
    paths: {
        "/api/health": {
            get: {
                summary: "Health check",
                security: [],
                responses: {
                    "200": { description: "API is healthy" },
                },
            },
        },
        "/api/auth/sign-up": {
            post: {
                tags: ["Auth"],
                summary: "sign up new user",
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    email: { type: "string" },
                                    password: { type: "string" },
                                    confirmPassword: { type: "string" }
                                }
                            }
                        }
                    }
                },
                responses: { "201": { description: "User registered" } }
            }
        },
        "/api/auth/sign-in": {
            post: {
                tags: ["Auth"],
                summary: "sign-in user",
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    email: { type: "string" },
                                    password: { type: "string" }
                                }
                            }
                        }
                    }
                },
                responses: { "200": { description: "User logged in" } }
            }
        },
        "/api/auth/verify-email": {
            post: {
                tags: ["Auth"],
                summary: "verify email with code",
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    email: { type: "string" },
                                    code: { type: "string" }
                                }
                            }
                        }
                    }
                },
                responses: { "200": { description: "Email verified successfully" } }
            }
        },
        "/api/auth/me": {
            get: {
                tags: ["Auth"],
                summary: "Get current user profile",
                responses: { "200": { description: "Current user data" } }
            }
        },
        "/api/auth/sign-out": {
            post: {
                tags: ["Auth"],
                summary: "Logout user",
                responses: { "200": { description: "Logged out successfully" } }
            }
        },
        "/api/products/preview": {
            post: {
                tags: ["Products"],
                summary: "Preview product data without saving",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    url: { type: "string" }
                                }
                            }
                        }
                    }
                },
                responses: { "200": { description: "Product preview data" } }
            }
        },
        "/api/products": {
            get: {
                tags: ["Products"],
                summary: "Get all products",
                responses: { "200": { description: "List of products" } }
            },
            post: {
                tags: ["Products"],
                summary: "Add a new product to be tracked globally",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    url: { type: "string" }
                                }
                            }
                        }
                    }
                },
                responses: { "201": { description: "Product added" } }
            }
        },
        "/api/products/{id}/price-history": {
            get: {
                tags: ["Products"],
                summary: "Get price history of a product",
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } }
                ],
                responses: { "200": { description: "Price history data" } }
            }
        },
        "/api/tracked-products": {
            get: {
                tags: ["User Tracking"],
                summary: "Get my tracked products",
                responses: { "200": { description: "List of tracked products" } }
            },
            post: {
                tags: ["User Tracking"],
                summary: "Track a product",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    url: { type: "string" },
                                    targetPrice: { type: "number" }
                                }
                            }
                        }
                    }
                },
                responses: { "201": { description: "Product tracked" } }
            }
        },
        "/api/plans": {
            get: {
                tags: ["Plans"],
                summary: "Get available subscription plans",
                security: [],
                responses: { "200": { description: "List of plans" } }
            }
        },
        "/api/plans/{id}": {
            get: {
                tags: ["Plans"],
                summary: "Get specific subscription plan",
                security: [],
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } }
                ],
                responses: { "200": { description: "Plan detail" } }
            }
        },
        "/api/subscription": {
            get: {
                tags: ["Subscription"],
                summary: "Get my current subscription",
                responses: { "200": { description: "My subscription" } }
            }
        },
        "/api/subscription/status": {
            get: {
                tags: ["Subscription"],
                summary: "Get my subscription status summary",
                responses: { "200": { description: "Status summary" } }
            }
        },
        "/api/subscription/checkout": {
            post: {
                tags: ["Subscription"],
                summary: "Start a checkout process for a plan",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    planId: { type: "string" }
                                }
                            }
                        }
                    }
                },
                responses: { "200": { description: "Returns checkout URL" } }
            }
        },
        "/api/subscription/cancel": {
            post: {
                tags: ["Subscription"],
                summary: "Cancel active subscription at period end",
                responses: { "200": { description: "Subscription cancelled" } }
            }
        },
        "/api/payments": {
            get: {
                tags: ["Payments"],
                summary: "Get my payment history",
                responses: { "200": { description: "List of payments" } }
            }
        },
        "/api/payments/webhook": {
            post: {
                tags: ["Payments"],
                summary: "Payment Gateway Webhook",
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    eventId: { type: "string" },
                                    eventType: { type: "string" },
                                    providerTransactionId: { type: "string" },
                                    status: { type: "string", enum: ["SUCCESS", "FAILED"] },
                                    payload: { type: "object" }
                                }
                            }
                        }
                    }
                },
                responses: { "200": { description: "Webhook processed" } }
            }
        },
        "/api/admin/users": {
            get: {
                tags: ["Admin"],
                summary: "Get all users",
                responses: { "200": { description: "List of users" } }
            }
        },
        "/api/admin/plans": {
            post: {
                tags: ["Admin"],
                summary: "Create a new plan",
                responses: { "201": { description: "Plan created" } }
            }
        },
        "/api/admin/subscriptions": {
            get: {
                tags: ["Admin"],
                summary: "Get all subscriptions",
                responses: { "200": { description: "List of subscriptions" } }
            }
        },
        "/api/admin/payments": {
            get: {
                tags: ["Admin"],
                summary: "Get all payments",
                responses: { "200": { description: "List of payments" } }
            }
        },
        "/api/notifications": {
            get: {
                tags: ["Notifications"],
                summary: "Get notifications",
                responses: { "200": { description: "List of notifications" } }
            }
        }
    }
};