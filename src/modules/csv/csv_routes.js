// Routes

const express = require('express');
const path = require('path');
const router = express.Router();
const csv_controller = require('./csv_controller');

// GET - Render page
router.get('/', csv_controller.getPage);

// Serve the frontend csv.js referenced by csv.html (adjust root if your static
// assets are served differently elsewhere in the app, e.g. via express.static)
router.get('/static/csv.js', (req, res) => {
    res.sendFile('csv.js', { root: path.join(__dirname, 'static') });
});

// POST - CSV imports (sku_db schema)
router.post('/import/my-products', csv_controller.importMyProducts);
router.post('/import/lazada', csv_controller.importLazadaProducts);
router.post('/import/shopee', csv_controller.importShopeeProducts);

module.exports = router;
