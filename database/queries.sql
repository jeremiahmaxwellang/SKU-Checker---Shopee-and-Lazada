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