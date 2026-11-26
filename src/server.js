require('dotenv').config();

const app = require('./app');
const { connectDB } = require('./db');

const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET) < 32) {
  console.error('JWT_SECRET missing or too short');
  process.exit(1);
}

connectDB(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API đang chạy tại cổng ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(
      'Không kết nối được cơ sở dữ liệu:',
      err.message
    );
    process.exit(1);
  });
