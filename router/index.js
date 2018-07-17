const express = require('express')
const router = express.Router()

// Exportar estaticos..
router.use(express.static('js'))
router.use('/static', express.static('static'));

router.get('/', (req, res) => {
  res.render('index')
});

router.get('/token-pairs', (req, res) => {
  res.render('token-pairs')
});

router.get('/balances', (req, res) => {
  res.render('balances')
});

router.get('/orderbook', (req, res) => {
  res.render('orderbook')
});

router.get('/post-order', (req, res) => {
  res.render('post-order')
});

router.get('/orders', (req, res) => {
  res.render('orders')
});

router.get('/wrap-ether', (req, res) => {
  res.render('wrap-ether')
});

router.get('/allowences', (req, res) => {
  res.render('allowences')
});

module.exports = router
