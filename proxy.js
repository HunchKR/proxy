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
  try {
    const apiRes = await fetch('https://wc-piwm.onrender.com/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const text = await apiRes.text(); // 200이 아닌 경우에도 처리 가능하게
    const contentType = apiRes.headers.get('content-type');

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({
        message: '로그인 실패',
        detail: text
      });
    }

    // JSON 형식이면 파싱, 아니면 문자열로 처리
    const data = contentType?.includes('application/json') ? JSON.parse(text) : { message: text };
    res.status(apiRes.status).json(data);
  } catch (err) {
    console.error('❌ 프록시 오류:', err);
    res.status(500).json({ message: '프록시 서버 오류', error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`프록시 서버 실행 중 on port ${PORT}`));
