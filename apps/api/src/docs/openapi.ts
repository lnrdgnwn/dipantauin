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
            cookieAuth: {
                type: "apiKey",
                in: "cookie",
                name: "accessToken"
            }
        }
    },
    security: [
        {
            cookieAuth: []
        }
    ],
    paths: {
        "/api/health/live": {
            get: {
                summary: "Health check",
                security: [],
                responses: {
                    "200": { description: "API is healthy" },
                },
            },
        },
        "/api/health/ready": { get: { summary: "Dependency readiness", security: [], responses: { "200": { description: "Dependencies ready" }, "503": { description: "Dependency unavailable" } } } },
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
                                    name: { type: "string" },
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
            },
            patch: {
                tags: ["Auth"],
                summary: "Update current user profile",
                requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string", maxLength: 255 } } } } } },
                responses: { "200": { description: "Updated current user" } }
            }
        },
        "/api/auth/me/password": { patch: { tags: ["Auth"], summary: "Change password and revoke refresh sessions", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["currentPassword", "newPassword", "confirmPassword"], properties: { currentPassword: { type: "string" }, newPassword: { type: "string", minLength: 8 }, confirmPassword: { type: "string", minLength: 8 } } } } } }, responses: { "200": { description: "Password updated; sign-in required" } } } },
        "/api/auth/sign-out": {
            post: {
                tags: ["Auth"],
                summary: "Logout user",
                responses: { "200": { description: "Logged out successfully" } }
            }
        },
        "/api/auth/refresh": { post: { tags: ["Auth"], summary: "Rotate refresh token and renew the session", security: [], responses: { "200": { description: "Session renewed" }, "401": { description: "Refresh token missing, invalid, or expired" } } } },
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
                    { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
                    { name: "cursor", in: "query", schema: { type: "string", pattern: "^[0-9]+$" } },
                    { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 50 } },
                    { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
                    { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
                    { name: "order", in: "query", schema: { type: "string", enum: ["newest", "oldest"], default: "newest" } }
                ],
                responses: { "200": { description: "Price history data" } }
            }
        },
        "/api/products/{id}": {
            get: { tags: ["Products"], summary: "Get a global product", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "Product detail" }, "404": { description: "Product not found" } } },
            delete: { tags: ["Products"], summary: "Delete a global product (admin only)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "Global product deleted" }, "403": { description: "Admin access required" }, "404": { description: "Product not found" } } }
        },
        "/api/tracked-products": {
            get: {
                tags: ["User Tracking"],
                summary: "Get my tracked products",
                parameters: [
                    { name: "cursor", in: "query", schema: { type: "string", format: "uuid" } },
                    { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
                    { name: "search", in: "query", schema: { type: "string", maxLength: 100 } },
                    { name: "marketplace", in: "query", schema: { type: "string", enum: ["TOKOPEDIA", "SHOPEE", "BLIBLI"] } },
                    { name: "status", in: "query", schema: { type: "string", enum: ["ACTIVE", "PAUSED", "UNAVAILABLE"] } }
                ],
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
        "/api/tracked-products/{id}": {
            get: { tags: ["User Tracking"], summary: "Get one owned tracked product", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "Tracked product detail" }, "404": { description: "Tracked product not found" } } },
            patch: { tags: ["User Tracking"], summary: "Update owned tracking settings", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", additionalProperties: false, properties: { targetPrice: { type: "number", minimum: 1, nullable: true }, isActive: { type: "boolean" }, notifyOnDrop: { type: "boolean" }, notifyOnIncrease: { type: "boolean" } } } } } }, responses: { "200": { description: "Tracking settings updated" }, "400": { description: "Invalid payload" }, "404": { description: "Tracked product not found" }, "409": { description: "Product limit reached" } } },
            delete: { tags: ["User Tracking"], summary: "Untrack an owned product without deleting the shared product", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "Tracking relationship removed" }, "404": { description: "Tracked product not found" } } }
        },
        "/api/tracked-products/{id}/check-now": { post: { tags: ["User Tracking"], summary: "Queue a development-only product check", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "Check queued" }, "404": { description: "Unavailable in production or product not found" }, "409": { description: "Tracking cannot currently be checked" } } } },
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
        "/api/payments/{id}": { get: { tags: ["Payments"], summary: "Get one owned payment", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "Owned payment detail" }, "404": { description: "Payment not found" } } } },
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
                summary: "Get a filtered cursor page of users",
                responses: { "200": { description: "List of users" } }
            }
        },
        "/api/admin/users/{id}": { get: { tags: ["Admin"], summary: "Get user account detail", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "User detail" } } } },
        "/api/admin/users/{id}/status": { patch: { tags: ["Admin"], summary: "Update a user account status", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["status"], additionalProperties: false, properties: { status: { type: "string", enum: ["ACTIVE", "SUSPENDED", "DELETED"] } } } } } }, responses: { "200": { description: "User status updated" }, "400": { description: "Invalid status" }, "404": { description: "User not found" } } } },
        "/api/admin/dashboard/summary": { get: { tags: ["Admin"], summary: "Get aggregate admin dashboard statistics", responses: { "200": { description: "Global aggregate counts and paid revenue" } } } },
        "/api/admin/plans": {
            post: {
                tags: ["Admin"],
                summary: "Create a new plan",
                responses: { "201": { description: "Plan created" } }
            }
        },
        "/api/admin/plans/{id}": { patch: { tags: ["Admin"], summary: "Update editable plan fields or disable a plan", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", additionalProperties: false, properties: { code: { type: "string", maxLength: 50 }, name: { type: "string", maxLength: 100 }, price: { type: "number", minimum: 0 }, currency: { type: "string", minLength: 3, maxLength: 3 }, maxProducts: { type: "integer", minimum: 1 }, checkIntervalMin: { type: "integer", minimum: 1 }, isActive: { type: "boolean" } } } } } }, responses: { "200": { description: "Plan updated" }, "400": { description: "Invalid plan fields" }, "404": { description: "Plan not found" } } } },
        "/api/admin/subscriptions": {
            get: {
                tags: ["Admin"],
                summary: "Get all subscriptions",
                responses: { "200": { description: "List of subscriptions" } }
            }
        },
        "/api/admin/subscriptions/{id}": { get: { tags: ["Admin"], summary: "Get subscription detail", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "Subscription detail" } } } },
        "/api/admin/subscriptions/{id}/cancel": { post: { tags: ["Admin"], summary: "Schedule cancellation of a subscription", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "Subscription cancellation scheduled" }, "404": { description: "Subscription not found" } } } },
        "/api/admin/payments": {
            get: {
                tags: ["Admin"],
                summary: "Get all payments",
                responses: { "200": { description: "List of payments" } }
            }
        },
        "/api/admin/payments/{id}": { get: { tags: ["Admin"], summary: "Get payment and sanitized event metadata", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "Payment detail" } } } },
        "/api/admin/price-checks": { get: { tags: ["Admin"], summary: "Get filtered price-check diagnostics", parameters: [{ name: "status", in: "query", schema: { type: "string", enum: ["PENDING", "SUCCESS", "FAILED"] } }, { name: "marketplace", in: "query", schema: { type: "string", enum: ["TOKOPEDIA", "SHOPEE", "BLIBLI"] } }, { name: "cursor", in: "query", schema: { type: "string" } }, { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } }], responses: { "200": { description: "Sanitized price-check page" } } } },
        "/api/notifications": {
            get: {
                tags: ["Notifications"],
                summary: "Get notifications",
                parameters: [{ name: "read", in: "query", schema: { type: "boolean" } }, { name: "type", in: "query", schema: { type: "string", enum: ["PRICE_DROP", "PRICE_INCREASE", "TARGET_REACHED", "SYSTEM"] } }, { name: "order", in: "query", schema: { type: "string", enum: ["newest", "oldest"] } }, { name: "cursor", in: "query", schema: { type: "string", format: "uuid" } }, { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } }],
                responses: { "200": { description: "List of notifications" } }
            }
        },
        "/api/notifications/unread-count": { get: { tags: ["Notifications"], summary: "Get unread notification count", responses: { "200": { description: "Unread count" } } } },
        "/api/notifications/read-all": { patch: { tags: ["Notifications"], summary: "Mark all owned unread notifications as read", responses: { "200": { description: "Number of notifications updated" } } } },
        "/api/notifications/{id}/read": { patch: { tags: ["Notifications"], summary: "Mark an owned notification as read", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "Notification marked read" }, "404": { description: "Notification not found" } } } },
        "/api/notifications/{id}": { delete: { tags: ["Notifications"], summary: "Delete an owned notification", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "204": { description: "Notification deleted" }, "404": { description: "Notification not found" } } } }
    }
};
