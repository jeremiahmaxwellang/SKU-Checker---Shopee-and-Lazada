const db = require("../../config/database");

// ===== CSV IMPORT HELPERS =====
function toNullable(val) {
    if (val === undefined || val === null) return null;
    const trimmed = String(val).trim();
    return trimmed === "" ? null : trimmed;
}

function toDecimal(val) {
    const v = toNullable(val);
    if (v === null) return null;
    const cleaned = v.replace(/,/g, "");
    const num = Number.parseFloat(cleaned);
    return Number.isFinite(num) ? num : null;
}

function toInt(val) {
    const v = toNullable(val);
    if (v === null) return null;
    const num = Number.parseInt(v, 10);
    return Number.isInteger(num) ? num : null;
}

function toDatetime(val) {
    // Accepts empty strings as null, otherwise passes the value through
    // (expects a MySQL-parseable date string, e.g. 'YYYY-MM-DD HH:MM:SS').
    const v = toNullable(val);
    if (v === null) return null;
    const parsed = new Date(v);
    if (Number.isNaN(parsed.getTime())) return null;
    // Format as 'YYYY-MM-DD HH:MM:SS' for MySQL DATETIME
    return parsed.toISOString().slice(0, 19).replace("T", " ");
}

// 1. Serve the HTML page
exports.getPage = (req, res) => {
    res.sendFile('csv.html', { root: './src/modules/csv' }); // Adjust root if your html is somewhere else
};

// ===== ALL ROUTES BELOW ARE OUTDATED AND ONLY USED FOR SHOWING THE SAMPLE CODE STRUCTURE. Please use the new SKU_DB SCHEMA =====
// GET ALL USERS WITH PLAYER DATA
exports.getAllUsersWithPlayerData = async (req, res) => {
    try {
        const query = `
            SELECT 
                u.userId,
                u.firstname,
                u.lastname,
                u.email,
                u.discord,
                u.position,
                u.status,
                COALESCE(CONCAT(p.gameName, '#', p.tagLine), 'N/A') AS riotId,
                COALESCE(p.teamId, 'N/A') AS teamId,
                p.primaryRoleId,
                p.secondaryRoleId
            FROM users u
            LEFT JOIN players p ON u.userId = p.userId
            ORDER BY u.firstname ASC
        `;

        const data = await db.query(query);
        
        if(!data || data[0].length === 0) {
            return res.status(200).send({
                success: false,
                message: 'No users found',
                data: []
            });
        }

        res.status(200).send({
            success: true,
            message: 'All users with player data',
            data: data[0]
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// GET USERS BY STATUS
exports.getUsersByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const normalizedStatus = typeof status === 'string' ? status.trim().toLowerCase() : '';
        const statusMap = {
            active: 'Active',
            inactive: 'Inactive',
            deactivated: 'Deactivated'
        };
        const dbStatus = statusMap[normalizedStatus];

        if (!dbStatus) {
            return res.status(400).send({
                success: false,
                message: 'Invalid status'
            });
        }

        const query = `
            SELECT 
                u.userId,
                u.firstname,
                u.lastname,
                u.email,
                u.discord,
                u.position,
                u.status,
                COALESCE(CONCAT(p.gameName, '#', p.tagLine), 'N/A') AS riotId,
                COALESCE(p.teamId, 'N/A') AS teamId,
                p.primaryRoleId,
                p.secondaryRoleId
            FROM users u
            LEFT JOIN players p ON u.userId = p.userId
            WHERE u.status = ?
            ORDER BY u.firstname ASC
        `;

        const data = await db.query(query, [dbStatus]);
        
        if(!data || data[0].length === 0) {
            return res.status(200).send({
                success: false,
                message: 'No users found with that status',
                data: []
            });
        }

        res.status(200).send({
            success: true,
            message: `Users with status: ${dbStatus}`,
            data: data[0]
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error fetching users by status',
            error: error.message
        });
    }
};

// DEACTIVATE USERS
exports.deactivateUsers = async (req, res) => {
    try {
        const { userIds } = req.body;

        if (!userIds || userIds.length === 0) {
            return res.status(400).send({
                success: false,
                message: 'No users selected'
            });
        }

        // Create placeholders for the IN clause
        const placeholders = userIds.map(() => '?').join(',');
        const query = `UPDATE users SET status = 'Deactivated' WHERE userId IN (${placeholders})`;

        await db.query(query, userIds);

        res.status(200).send({
            success: true,
            message: `${userIds.length} user(s) deactivated successfully`
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error deactivating users',
            error: error.message
        });
    }
};

// UPDATE A SINGLE USER'S POSITION AND STATUS
exports.updateUserPositionAndStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { position, status, riotId, primaryRoleId, secondaryRoleId } = req.body;

        const parsedUserId = Number.parseInt(userId, 10);
        if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
            return res.status(400).send({
                success: false,
                message: 'Invalid user id'
            });
        }

        const validPositions = ['Team Manager', 'Team Coach', 'Player', 'Sub', 'Applicant'];
        const validStatuses = ['Active', 'Inactive', 'Deactivated'];

        if (!validPositions.includes(position)) {
            return res.status(400).send({
                success: false,
                message: 'Invalid position'
            });
        }

        if (!validStatuses.includes(status)) {
            return res.status(400).send({
                success: false,
                message: 'Invalid status'
            });
        }

        const updateQuery = `
            UPDATE users
            SET position = ?, status = ?
            WHERE userId = ?
        `;

        const [updateResult] = await db.query(updateQuery, [position, status, parsedUserId]);

        if (!updateResult || updateResult.affectedRows === 0) {
            return res.status(404).send({
                success: false,
                message: 'User not found'
            });
        }

        // When position is Player, upsert the players table with role and riot id data
        if (position === 'Player') {
            const parsedPrimaryRoleId = Number.parseInt(primaryRoleId, 10);
            if (!Number.isInteger(parsedPrimaryRoleId) || parsedPrimaryRoleId <= 0) {
                return res.status(400).send({
                    success: false,
                    message: 'Primary role is required when position is Player'
                });
            }

            const parsedSecondaryRoleId = secondaryRoleId ? Number.parseInt(secondaryRoleId, 10) : null;

            let gameName = null;
            let tagLine = null;
            if (riotId && riotId.trim() && riotId !== 'N/A') {
                const parts = riotId.trim().split('#');
                if (parts.length === 2) {
                    gameName = parts[0].trim() || null;
                    tagLine = parts[1].trim() || null;
                }
            }

            const upsertPlayerQuery = `
                INSERT INTO players (userId, primaryRoleId, secondaryRoleId, gameName, tagLine)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    primaryRoleId = VALUES(primaryRoleId),
                    secondaryRoleId = VALUES(secondaryRoleId),
                    gameName = COALESCE(VALUES(gameName), gameName),
                    tagLine = COALESCE(VALUES(tagLine), tagLine)
            `;

            await db.query(upsertPlayerQuery, [
                parsedUserId,
                parsedPrimaryRoleId,
                parsedSecondaryRoleId,
                gameName,
                tagLine
            ]);
        }

        res.status(200).send({
            success: true,
            message: 'User updated successfully'
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
};

// ===== CSV IMPORT ROUTES (sku_db schema) =====

// IMPORT "MY PRODUCTS" CSV -> sku_db.my_products
// Expected row shape: { sku, product_name, category_name }
// Note: my_products.sku has no unique constraint in the schema, so we
// look up existing rows by sku ourselves and split into insert/update sets.
exports.importMyProducts = async (req, res) => {
    try {
        const { rows } = req.body;

        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(400).send({
                success: false,
                message: 'No rows provided'
            });
        }

        const cleanRows = rows
            .map((r) => ({
                sku: toNullable(r.sku),
                product_name: toNullable(r.product_name),
                category_name: toNullable(r.category_name)
            }))
            .filter((r) => r.sku !== null);

        if (cleanRows.length === 0) {
            return res.status(400).send({
                success: false,
                message: 'No valid rows (each row needs at least a SKU)'
            });
        }

        // Resolve category_name -> category_id (case-insensitive), where possible
        const [categoryRows] = await db.query('SELECT category_id, category_name FROM categories');
        const categoryMap = new Map(
            categoryRows.map((c) => [String(c.category_name || '').trim().toLowerCase(), c.category_id])
        );

        const skus = cleanRows.map((r) => r.sku);
        const skuPlaceholders = skus.map(() => '?').join(',');
        const [existingRows] = await db.query(
            `SELECT product_id, sku FROM my_products WHERE sku IN (${skuPlaceholders})`,
            skus
        );
        const existingSkuMap = new Map(existingRows.map((r) => [r.sku, r.product_id]));

        const toInsert = [];
        const toUpdate = [];

        cleanRows.forEach((r) => {
            const category_id = r.category_name
                ? categoryMap.get(r.category_name.toLowerCase()) ?? null
                : null;

            if (existingSkuMap.has(r.sku)) {
                toUpdate.push({ ...r, category_id, product_id: existingSkuMap.get(r.sku) });
            } else {
                toInsert.push({ ...r, category_id });
            }
        });

        if (toInsert.length > 0) {
            const values = toInsert.map((r) => [r.sku, r.product_name, r.category_name, r.category_id]);
            await db.query(
                'INSERT INTO my_products (sku, product_name, category_name, category_id) VALUES ?',
                [values]
            );
        }

        for (const r of toUpdate) {
            await db.query(
                'UPDATE my_products SET product_name = ?, category_name = ?, category_id = ? WHERE product_id = ?',
                [r.product_name, r.category_name, r.category_id, r.product_id]
            );
        }

        res.status(200).send({
            success: true,
            message: `Imported ${toInsert.length} new product(s), updated ${toUpdate.length} existing product(s)`
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error importing My Products CSV',
            error: error.message
        });
    }
};

// IMPORT LAZADA CSV -> sku_db.lazada_products
// product_id is the primary key, so we can bulk upsert with ON DUPLICATE KEY UPDATE.
exports.importLazadaProducts = async (req, res) => {
    try {
        const { rows } = req.body;

        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(400).send({
                success: false,
                message: 'No rows provided'
            });
        }

        const cleanRows = rows
            .map((r) => ({
                product_id: toNullable(r.product_id),
                catId: toNullable(r.catId),
                product_name: toNullable(r.product_name),
                currency: toNullable(r.currency),
                sku_id: toNullable(r.sku_id),
                status: toNullable(r.status),
                shop_sku: toNullable(r.shop_sku),
                quantity: toInt(r.quantity),
                special_price: toDecimal(r.special_price),
                special_price_start: toDatetime(r.special_price_start),
                special_price_end: toDatetime(r.special_price_end),
                price: toDecimal(r.price),
                variations_combo: toNullable(r.variations_combo),
                tr: toNullable(r.tr)
            }))
            .filter((r) => r.product_id !== null);

        if (cleanRows.length === 0) {
            return res.status(400).send({
                success: false,
                message: 'No valid rows (each row needs a product_id)'
            });
        }

        const values = cleanRows.map((r) => [
            r.product_id, r.catId, r.product_name, r.currency, r.sku_id, r.status,
            r.shop_sku, r.quantity, r.special_price, r.special_price_start,
            r.special_price_end, r.price, r.variations_combo, r.tr
        ]);

        await db.query(
            `INSERT INTO lazada_products
                (product_id, catId, product_name, currency, sku_id, status, shop_sku,
                 quantity, special_price, special_price_start, special_price_end,
                 price, variations_combo, tr)
             VALUES ?
             ON DUPLICATE KEY UPDATE
                catId = VALUES(catId),
                product_name = VALUES(product_name),
                currency = VALUES(currency),
                sku_id = VALUES(sku_id),
                status = VALUES(status),
                shop_sku = VALUES(shop_sku),
                quantity = VALUES(quantity),
                special_price = VALUES(special_price),
                special_price_start = VALUES(special_price_start),
                special_price_end = VALUES(special_price_end),
                price = VALUES(price),
                variations_combo = VALUES(variations_combo),
                tr = VALUES(tr)`,
            [values]
        );

        res.status(200).send({
            success: true,
            message: `Imported/updated ${cleanRows.length} Lazada product(s)`
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error importing Lazada CSV',
            error: error.message
        });
    }
};

// IMPORT SHOPEE CSV -> sku_db.shopee_products
// product_id is the primary key, so we can bulk upsert with ON DUPLICATE KEY UPDATE.
exports.importShopeeProducts = async (req, res) => {
    try {
        const { rows } = req.body;

        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(400).send({
                success: false,
                message: 'No rows provided'
            });
        }

        const cleanRows = rows
            .map((r) => ({
                product_id: toNullable(r.product_id),
                product_name: toNullable(r.product_name),
                variation_id: toNullable(r.variation_id),
                parent_sku: toNullable(r.parent_sku),
                sku: toNullable(r.sku),
                price: toDecimal(r.price),
                gtin: toNullable(r.gtin),
                stock: toNullable(r.stock),
                fail_reason: toNullable(r.fail_reason)
            }))
            .filter((r) => r.product_id !== null);

        if (cleanRows.length === 0) {
            return res.status(400).send({
                success: false,
                message: 'No valid rows (each row needs a product_id)'
            });
        }

        const values = cleanRows.map((r) => [
            r.product_id, r.product_name, r.variation_id, r.parent_sku,
            r.sku, r.price, r.gtin, r.stock, r.fail_reason
        ]);

        await db.query(
            `INSERT INTO shopee_products
                (product_id, product_name, variation_id, parent_sku, sku, price, gtin, stock, fail_reason)
             VALUES ?
             ON DUPLICATE KEY UPDATE
                product_name = VALUES(product_name),
                variation_id = VALUES(variation_id),
                parent_sku = VALUES(parent_sku),
                sku = VALUES(sku),
                price = VALUES(price),
                gtin = VALUES(gtin),
                stock = VALUES(stock),
                fail_reason = VALUES(fail_reason)`,
            [values]
        );

        res.status(200).send({
            success: true,
            message: `Imported/updated ${cleanRows.length} Shopee product(s)`
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error importing Shopee CSV',
            error: error.message
        });
    }
};