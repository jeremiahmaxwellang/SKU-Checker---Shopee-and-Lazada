// Routes

const express = require('express');
const path = require('path');
const router = express.Router();
const csv_controller = require('./csv_controller');

// GET - Render page
router.get('/', csv_controller.getPage);

// NOTE: csv.js is served by the app-level static middleware in index.js:
//   app.use('/csv/static', express.static(path.join(__dirname, './src/modules/csv/public')));
// so csv.js must live in src/modules/csv/public/csv.js — no route needed here.

// NOTE: this router is mounted at '/' in index.js (app.use('/', ...)), so these
// paths resolve to '/import/my-products' etc, NOT '/csv/import/my-products'.
// POST - CSV imports (sku_db schema)
router.post('/import/my-products', csv_controller.importMyProducts);
router.post('/import/lazada', csv_controller.importLazadaProducts);
router.post('/import/shopee', csv_controller.importShopeeProducts);

module.exports = router;
