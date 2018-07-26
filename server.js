const http      = require('http');
const express   = require('express');
const router    = require('./router');
const fs        = require('fs');
const port      = process.env.PORT || 3000;
const app       = express();
const server    = http.createServer(app);
const multipart = require('connect-multiparty')

app.use(multipart())
app.engine('html', require('ejs').renderFile)
app.set('view engine', 'html');
app.use('/', router);
server.listen(port, () => console.log(`server listen in: localhost:${port}`));
