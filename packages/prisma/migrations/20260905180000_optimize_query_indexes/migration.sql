-- Add composite indexes used by the API's paginated lists and worker scheduler.
CREATE INDEX `payments_userId_createdAt_idx` ON `payments`(`userId`, `createdAt`);
CREATE INDEX `products_status_nextCheckAt_idx` ON `products`(`status`, `nextCheckAt`);
CREATE INDEX `user_products_userId_isActive_createdAt_idx` ON `user_products`(`userId`, `isActive`, `createdAt`);
CREATE INDEX `price_checks_status_createdAt_idx` ON `price_checks`(`status`, `createdAt`);

DROP INDEX `notifications_userId_isRead_idx` ON `notifications`;
CREATE INDEX `notifications_userId_isRead_createdAt_idx` ON `notifications`(`userId`, `isRead`, `createdAt`);
