-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema sku_db
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema sku_db
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `sku_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `sku_db` ;

-- -----------------------------------------------------
-- Table `sku_db`.`shopee_products`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sku_db`.`shopee_products` (
  `product_id` VARCHAR(45) NOT NULL,
  `product_name` VARCHAR(45) NULL,
  `variation_id` VARCHAR(45) NULL,
  `parent_sku` VARCHAR(45) NULL,
  `sku` VARCHAR(45) NULL,
  `price` DECIMAL(10,2) NULL,
  `gtin` VARCHAR(45) NULL,
  `stock` VARCHAR(45) NULL,
  `fail_reason` VARCHAR(45) NULL,
  PRIMARY KEY (`product_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `sku_db`.`lazada_products`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sku_db`.`lazada_products` (
  `product_id` VARCHAR(45) NOT NULL,
  `catId` VARCHAR(45) NULL,
  `product_name` VARCHAR(45) NULL,
  `currency` VARCHAR(45) NULL,
  `sku_id` VARCHAR(45) NULL,
  `status` VARCHAR(45) NULL,
  `shop_sku` VARCHAR(45) NULL,
  `quantity` INT NULL,
  `special_price` DECIMAL(10,2) NULL,
  `special_price_start` DATETIME NULL,
  `special_price_end` DATETIME NULL,
  `price` DECIMAL(10,2) NULL,
  `variations_combo` VARCHAR(45) NULL,
  `tr` VARCHAR(45) NULL,
  PRIMARY KEY (`product_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `sku_db`.`categories`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sku_db`.`categories` (
  `category_id` INT NOT NULL,
  `category_name` VARCHAR(45) NULL COMMENT 'Grinder, Brewer, Dripper, Cup, Kettle, Scale, Accessories, Set, Electric Grinder, Hopper, Parts, ESP-Accessories, Nuttii, Hiflux',
  PRIMARY KEY (`category_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `sku_db`.`my_products`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sku_db`.`my_products` (
  `product_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sku` VARCHAR(45) NULL,
  `product_name` VARCHAR(45) NULL,
  `category_name` VARCHAR(45) NULL,
  `category_id` INT NULL COMMENT 'Grinder, Brewer, Dripper, Cup, Kettle, Scale, Accessories, Set, Electric Grinder, Hopper, Parts, ESP-Accessories, Nuttii, Hiflux',
  PRIMARY KEY (`product_id`),
  INDEX `fk_my_products_categories_idx` (`category_id` ASC) VISIBLE,
  CONSTRAINT `fk_my_products_categories`
    FOREIGN KEY (`category_id`)
    REFERENCES `sku_db`.`categories` (`category_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
