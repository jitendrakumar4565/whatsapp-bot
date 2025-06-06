const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const venom = require('venom-bot');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

let client = null;

venom
  .create({
    session: 'session-name',
    multidevice: true,
    logQR: true,
    headless: false
  })
  .then((bot) => {
    client = bot;
    console.log('✅ WhatsApp bot is ready!');
  })
  .catch((error) => {
    console.error('❌ Error:', error);
  });

app.post('/send-message', upload.single('file'), async (req, res) => {
  const number = req.body.number;
  const message = req.body.message || '';
  const file = req.file;

  if (!client) {
    return res.status(500).json({ status: false, message: 'Bot not ready' });
  }

  const formattedNumber = number.includes('@c.us') ? number : `${number}@c.us`;

  try {
    if (file) {
      const tempFilePath = path.join(__dirname, file.path);
      const newFilePath = path.join(__dirname, 'uploads', file.originalname);

      // Rename to include proper extension
      fs.renameSync(tempFilePath, newFilePath);

      await client.sendFile(
        formattedNumber,
        newFilePath,
        file.originalname,
        message
      );

      // Optional: Delete after sending
      fs.unlinkSync(newFilePath);
    } else {
      await client.sendText(formattedNumber, message);
    }

    res.json({ status: true, message: 'Message sent!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, message: 'Failed to send message.' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
