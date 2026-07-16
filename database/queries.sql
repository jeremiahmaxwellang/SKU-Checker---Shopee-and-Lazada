USE sku_db;

SELECT 
mp.sku AS 'TM-PH Barcode', mp.product_name AS 'Item Name', mp.category_name AS 'Category', 
l.price AS 'LAZADA', l.seller_sku AS 'LAZ SKU',
s.price AS 'SHOPEE', s.sku AS 'SHP SKU',
s2.price AS 'SHOPEE', s2.parent_sku AS 'SHP PARENT SKU'
FROM my_products mp
LEFT JOIN lazada_products l ON mp.sku = l.seller_sku
LEFT JOIN shopee_products s ON mp.sku = s.sku
LEFT JOIN shopee_products s2 ON mp.sku = s2.parent_sku
;

-- 1. Match SHP & LAZ SKUs, description, and price (doesn't show a shopee product thats not on Lazada)
-- SELECT 
-- l.seller_sku AS 'LAZ SKU', l.product_name AS 'LAZ NAME', l.price AS 'LAZ PRICE',

-- s.sku AS 'SHP SKU', s.product_name AS 'SHP NAME', s.price AS 'SHP PRICE',
-- s2.parent_sku AS 'SHP PARENT SKU', s2.product_name AS 'SHP PARENT NAME', s2.price AS 'SHP PRICE',

-- CASE
-- WHEN l.price = s.price OR l.price = s2.price THEN 'True'
-- ELSE 'False'
-- END AS 'IS PRICE EQUAL?'

-- FROM lazada_products l
-- LEFT JOIN shopee_products s ON l.seller_sku = s.sku
-- LEFT JOIN shopee_products s2 ON l.seller_sku = s2.parent_sku
-- ;

USE sku_db;

SELECT 
    l.seller_sku AS 'LAZ SKU',
	COALESCE(s.sku, s2.parent_sku) AS 'SHP SKU/PARENT SKU',
    
    l.product_name AS 'LAZ NAME',
    COALESCE(s.product_name, s2.product_name) AS 'SHP NAME',
    
	CASE
        WHEN COALESCE(s.product_name, s2.product_name) IS NULL THEN 'No Match'
        WHEN l.product_name = COALESCE(s.product_name, s2.product_name) THEN 'True'
        ELSE 'False'
    END AS 'IS NAME EQUAL?',
    
    l.price AS 'LAZ PRICE',
    COALESCE(s.price, s2.price) AS 'SHP PRICE',
    
    CASE
        WHEN COALESCE(s.price, s2.price) IS NULL THEN 'No Match'
        WHEN l.price = COALESCE(s.price, s2.price) THEN 'True'
        ELSE 'False'
    END AS 'IS PRICE EQUAL?'

FROM lazada_products l
LEFT JOIN shopee_products s  ON l.seller_sku = s.sku
LEFT JOIN shopee_products s2 ON l.seller_sku = s2.parent_sku
                              AND s.sku IS NULL   -- only fall back to parent-sku match if no direct sku match
ORDER BY l.product_id
;