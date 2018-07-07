const express = require('express')
const router = express.Router()

// Exportar estaticos..
router.use(express.static('js'))
router.use('/static', express.static('static'));

router.get('/', (req, res) => {
  res.render('index')
});

router.get('/markets', (req, res) => {
  res.render('markets')
});

router.get('/api-call', (req, res) => {
  res.render('api_call')
});

module.exports = router
