-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `mydb` ;

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `mydb` DEFAULT CHARACTER SET utf8 ;
-- -----------------------------------------------------
-- Schema sku_db
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `sku_db` ;

-- -----------------------------------------------------
-- Schema sku_db
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `sku_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `mydb` ;

-- -----------------------------------------------------
-- Table `mydb`.`shopify_products`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`shopify_products` (
  `index` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `handle` TEXT NULL,
  `title` TEXT NULL,
  `body` TEXT NULL,
  `vendor` TEXT NULL,
  `product_category` TEXT NULL,
  `type` TEXT NULL,
  `tags` TEXT NULL,
  `published` TEXT NULL,
  `option1_name` TEXT NULL,
  `option1_value` TEXT NULL,
  `option1_linked_to` TEXT NULL,
  `option2_name` TEXT NULL,
  `option2_value` TEXT NULL,
  `option2_linked_to` TEXT NULL,
  `option3_name` TEXT NULL,
  `option3_value` TEXT NULL,
  `option3_linked_to` TEXT NULL,
  `variant_sku` TEXT NULL,
  `variant_grams` TEXT NULL,
  `variant_inventory_tracker` TEXT NULL,
  `variant_inventory_qty` TEXT NULL,
  `variant_inventory_policy` TEXT NULL,
  `variant_fulfillment_service` TEXT NULL,
  `variant_price` DECIMAL(10,2) NULL,
  `variant_compare_at_price` TEXT NULL,
  `variant_requires_shipping` TEXT NULL,
  `variant_taxable` TEXT NULL,
  `unit_price_total_measure` TEXT NULL,
  `unit_price_total_measure_unit` TEXT NULL,
  `unit_price_base_measure` TEXT NULL,
  `unit_price_base_measure_unit` TEXT NULL,
  `variant_barcode` TEXT NULL,
  `image_src` TEXT NULL,
  `image_position` TEXT NULL,
  `image_alt_text` TEXT NULL,
  `gift_card` TEXT NULL,
  `seo_title` TEXT NULL,
  `seo_description` TEXT NULL,
  `allergen_information` TEXT NULL,
  `caffeine_content` TEXT NULL,
  `coffee_product_form` TEXT NULL,
  `coffee_roast` TEXT NULL,
  `color` TEXT NULL,
  `country` TEXT NULL,
  `dietary_preferences` TEXT NULL,
  `filter_material` TEXT NULL,
  `flavor` TEXT NULL,
  `grind_size` TEXT NULL,
  `variant_image` TEXT NULL,
  `variant_weight_limit` TEXT NULL,
  `variant_tax_code` TEXT NULL,
  `cost_per_item` DECIMAL(10,2) NULL,
  `status` TEXT NULL,
  PRIMARY KEY (`index`))
ENGINE = InnoDB;

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
