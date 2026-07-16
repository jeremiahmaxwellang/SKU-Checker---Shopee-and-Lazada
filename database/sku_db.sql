-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema sku_db
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `sku_db` ;

-- -----------------------------------------------------
-- Schema sku_db
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `sku_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `sku_db` ;

-- -----------------------------------------------------
-- Table `sku_db`.`lazada_products`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sku_db`.`lazada_products` (
  `index` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT NULL DEFAULT NULL,
  `catId` TEXT NULL DEFAULT NULL,
  `product_name` TEXT NULL DEFAULT NULL,
  `currency` TEXT NULL DEFAULT NULL,
  `sku_id` TEXT NULL DEFAULT NULL,
  `status` TEXT NULL DEFAULT NULL,
  `shop_sku` TEXT NULL DEFAULT NULL,
  `seller_sku` TEXT NULL DEFAULT NULL,
  `quantity` INT NULL DEFAULT NULL,
  `special_price` DECIMAL(10,2) NULL DEFAULT NULL,
  `special_price_start` DATETIME NULL DEFAULT NULL,
  `special_price_end` DATETIME NULL DEFAULT NULL,
  `price` DECIMAL(10,2) NULL DEFAULT NULL,
  `variations_combo` TEXT NULL DEFAULT NULL,
  `tr` TEXT NULL DEFAULT NULL,
  PRIMARY KEY (`index`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `sku_db`.`my_products`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sku_db`.`my_products` (
  `product_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sku` TEXT NULL DEFAULT NULL,
  `product_name` TEXT NULL DEFAULT NULL,
  `category_name` TEXT NULL DEFAULT NULL,
  PRIMARY KEY (`product_id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `sku_db`.`shopee_products`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sku_db`.`shopee_products` (
  `index` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT NULL DEFAULT NULL,
  `product_name` TEXT NULL DEFAULT NULL,
  `variation_id` TEXT NULL DEFAULT NULL,
  `variation_name` TEXT NULL DEFAULT NULL,
  `parent_sku` TEXT NULL DEFAULT NULL,
  `sku` TEXT NULL DEFAULT NULL,
  `price` DECIMAL(10,2) NULL DEFAULT NULL,
  `gtin` TEXT NULL DEFAULT NULL,
  `stock` TEXT NULL DEFAULT NULL,
  `fail_reason` TEXT NULL DEFAULT NULL,
  PRIMARY KEY (`index`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
