
const express = require('express');
const os = require('os');

const notesRouter = require('./routes/notes');

const app = express();

app.use(express.json());

// API Bai 1 - giu nguyen
app.get('/', (req, res) => {
  res.json({
    message: 'Xin chào từ đám mây!',
    host: os.hostname(),
    platform: `${os.type()} ${os.release()}`,
    cpus: os.cpus().length,
    memoryGB: Number(
      (os.totalmem() / 1024 ** 3).toFixed(1)
    ),
    uptimeSec: Math.round(os.uptime()),
    time: new Date().toISOString()
  });
});

// API Bai 3
app.use('/notes', notesRouter);

// Xu ly loi
app.use((err, req, res, next) => {
  console.error(err);

  const clientError =
    ['ValidationError', 'CastError'].includes(err.name) ||
    err.code === 'LIMIT_FILE_SIZE' ||
    err.status === 400;

  res.status(clientError ? 400 : 500).json({
    error: clientError
      ? err.message
      : 'Lỗi máy chủ nội bộ'
  });
});

module.exports = app;
