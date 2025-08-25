const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const conectar = require('./bd');
const router = require('./network/router');

const app = express();

app.use(cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

app.use('/', router);

conectar(config.DB_URL);

http.createServer(app).listen(config.PORT, () => {
  console.log(`API en http://${config.HOST}:${config.PORT}`);
});
