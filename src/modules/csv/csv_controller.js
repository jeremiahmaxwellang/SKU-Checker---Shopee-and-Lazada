// Team Management Controller
// - Contains queries for team management page

const db = require("../../config/database");

// 1. Serve the HTML page
exports.getPage = (req, res) => {
    res.sendFile('csv.html', { root: './src/modules/csv' }); // Adjust root if your html is somewhere else
};

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