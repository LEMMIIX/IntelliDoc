const db = require('../../ConnectPostgres');

exports.getFolders = async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized: User not logged in' });
    }

    const userId = parseInt(req.session.userId, 10);

    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    try {
        const query = `
            WITH RECURSIVE folder_tree AS (
                SELECT folder_id, parent_folder_id, folder_name, 1 AS level
                FROM main.folders
                WHERE user_id = $1 AND parent_folder_id IS NULL
                UNION ALL
                SELECT f.folder_id, f.parent_folder_id, f.folder_name, ft.level + 1
                FROM main.folders f
                JOIN folder_tree ft ON f.parent_folder_id = ft.folder_id
                WHERE f.user_id = $1
            )
            SELECT ft.*, array_agg(files.file_id || ':' || files.file_name) AS files
            FROM folder_tree ft
            LEFT JOIN main.files ON files.folder_id = ft.folder_id
            GROUP BY ft.folder_id, ft.parent_folder_id, ft.folder_name, ft.level
            ORDER BY ft.level, ft.folder_name;
        `;
        
        const result = await db.query(query, [userId]);
        
        const buildTree = (folders, parentId = null) => {
            return folders
                .filter(folder => folder.parent_folder_id === parentId)
                .map(folder => ({
                    id: folder.folder_id,
                    name: folder.folder_name,
                    files: folder.files[0] ? folder.files.map(file => {
                        const [id, name] = file.split(':');
                        return { id, name };
                    }) : [],
                    children: buildTree(folders, folder.folder_id)
                }));
        };
        
        const folderTree = buildTree(result.rows);
        res.json(folderTree);
    } catch (error) {
        console.error('Error fetching folders:', error);
        res.status(500).json({ message: 'Error fetching folders' });
    }
};