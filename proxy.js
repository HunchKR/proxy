const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: 'http://undertale.dothome.co.kr', // 정확히 지정
  credentials: true
}));
app.use(express.json());

app.post('/proxy/login', async (req, res) => {
  const apiRes = await fetch('https://wc-piwm.onrender.com/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body)
  });
  const data = await apiRes.json();
  res.status(apiRes.status).json(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`프록시 서버 실행 중 on port ${PORT}`));
