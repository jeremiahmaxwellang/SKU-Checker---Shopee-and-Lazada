// Routes

const express = require('express');
const path = require('path');
const router = express.Router();
const csv_controller = require('./csv_controller');

// GET - Render page
router.get('/', csv_controller.getPage);


module.exports = router;
