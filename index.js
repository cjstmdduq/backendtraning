require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const db = require('./config/db');

const app = express();
const port = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());

// 상담 문의 API
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: '필수 항목 누락' });
  }

  // DB 저장
  const sql = 'INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)';
  db.query(sql, [name, email, message], (err, result) => {
    if (err) {
      console.error('❌ DB 저장 실패:', err);
      return res.status(500).json({ message: 'DB 저장 실패' });
    }

    // 메일 전송
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"상담 문의" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO,
      subject: '새로운 상담 문의 도착',
      text: `이름: ${name}\n이메일: ${email}\n내용:\n${message}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ 이메일 전송 실패:', error);
        return res.status(500).json({ message: '이메일 전송 실패' });
      }

      res.status(200).json({ message: '문의가 성공적으로 접수되었습니다.' });
    });
  });
});

app.listen(port, () => {
  console.log(`✅ 서버 실행됨: http://localhost:${port}`);
});

