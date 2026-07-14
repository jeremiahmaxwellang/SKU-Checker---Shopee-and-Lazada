const express = require('express');
const path = require('path');
const dotenv = require('dotenv').config();
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const mySqlPool = require('./src/config/database');

const app = express();
const port = process.env.PORT || 3000;
app.set("view engine", 'hbs');
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));
app.use(fileUpload({
    createParentPath: true,
    limits: { fileSize: 50 * 1024 * 1024 },
    abortOnLimit: true
}));

// Middleware to handle file upload errors and return JSON
app.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE' || (err.message && err.message.includes('File size'))) {
        return res.status(413).json({
            success: false,
            message: 'File size exceeds the maximum allowed limit of 50MB'
        });
    }
    next(err);
});

app.use(cookieParser());


// Serve static files from the "public" directory
// for shared assets (style.css, sidebar.js, images, fonts)
app.use(express.static(path.join(process.cwd(), './public')));

global.viewsPath = path.join(process.cwd(), 'views');

// =================== Routes ===================

app.use('/csv/static', express.static(path.join(__dirname, './src/modules/csv/public')));
app.use('/', require('./src/modules/csv/csv_routes'));


mySqlPool.query('SELECT 1').then(() => {
    console.log('MySQL DB Connected');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});