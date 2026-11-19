
require('dotenv').config();

const mongoose = require('mongoose');
const Note = require('../src/models/note');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Dam bao chi muc tags da duoc tao
    await Note.createIndexes();

    // Cach 1: Quet toan bo collection
    const scan = await Note.find({
      tags: 'docker'
    })
      .hint({ $natural: 1 })
      .explain('executionStats');

    // Cach 2: Su dung chi muc tags
    const indexed = await Note.find({
      tags: 'docker'
    })
      .hint({ tags: 1 })
      .explain('executionStats');

    const a = scan.executionStats;
    const b = indexed.executionStats;

    console.table({
      'Quet toan bo': {
        docsExamined: a.totalDocsExamined,
        returned: a.nReturned,
        ms: a.executionTimeMillis
      },
      'Dung chi muc': {
        docsExamined: b.totalDocsExamined,
        returned: b.nReturned,
        ms: b.executionTimeMillis
      }
    });

    if (b.totalDocsExamined > 0) {
      const ratio =
        a.totalDocsExamined / b.totalDocsExamined;

      console.log(
        'Giam khoi luong quet:',
        ratio.toFixed(2),
        'lan'
      );
    }
  } catch (err) {
    console.error('Lỗi:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
