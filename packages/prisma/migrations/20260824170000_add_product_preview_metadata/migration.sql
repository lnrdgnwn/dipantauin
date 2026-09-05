ALTER TABLE `products`
  ADD COLUMN `imageUrl` TEXT NULL AFTER `sellerName`,
  ADD COLUMN `originalPrice` DECIMAL(15, 2) NULL AFTER `currentPrice`,
  ADD COLUMN `availability` VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN' AFTER `originalPrice`;
