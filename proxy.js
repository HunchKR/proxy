const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: 'http://undertale.dothome.co.kr',
  credentials: true
}));
app.use(express.json());

app.post('/proxy/login', async (req, res) => {
  console.log('프론트 로그인 요청 수신');
  console.log('userId:', req.body.userId);
  console.log('userPw:', req.body.userPw);

  try {
    const apiRes = await fetch('https://wc-piwm.onrender.com/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const text = await apiRes.text();
    const contentType = apiRes.headers.get('content-type');

    console.log('백엔드 응답 상태코드:', apiRes.status);
    console.log('백엔드 응답 헤더:', apiRes.headers.raw());
    console.log('백엔드 응답 내용:', text);

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({
        message: '로그인 실패',
        detail: text
      });
    }

    const data = contentType?.includes('application/json') ? JSON.parse(text) : { message: text };
    res.status(apiRes.status).json(data);
  } catch (err) {
    console.error('프록시 오류:', err);
    res.status(500).json({ message: '프록시 서버 오류', error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`프록시 서버 실행 중 on port ${PORT}`));
