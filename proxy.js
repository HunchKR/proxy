const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const busboy = require('busboy');
const FormData = require('form-data');
const app = express();

app.use(cors({
  origin: 'http://undertale.dothome.co.kr',
  credentials: true
}));
app.use(express.json());

// 로그인 프록시
app.post('/proxy/login', async (req, res) => {
  console.log('--- 로그인 요청 수신 ---');
  console.log('요청 내용:', req.body);

  try {
    const apiRes = await fetch('https://wc-piwm.onrender.com/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const text = await apiRes.text();
    console.log('백엔드 응답 상태:', apiRes.status);
    console.log('백엔드 응답 본문:', text);

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ message: '로그인 실패', detail: text });
    }

    const contentType = apiRes.headers.get('content-type');
    const data = contentType?.includes('application/json') ? JSON.parse(text) : { message: text };
    res.status(apiRes.status).json(data);
  } catch (err) {
    console.error('로그인 프록시 오류:', err);
    res.status(500).json({ message: '프록시 서버 오류', error: err.message });
  }
});

// 회원가입 프록시
app.post('/proxy/signUp', async (req, res) => {
  console.log('--- 회원가입 요청 수신 ---');
  console.log('요청 내용:', req.body);

  try {
    const apiRes = await fetch('https://wc-piwm.onrender.com/signUp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const text = await apiRes.text();
    console.log('백엔드 응답 상태:', apiRes.status);
    console.log('백엔드 응답 본문:', text);

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ message: '회원가입 실패', detail: text });
    }

    const contentType = apiRes.headers.get('content-type');
    const data = contentType?.includes('application/json') ? JSON.parse(text) : { message: text };
    res.status(apiRes.status).json(data);
  } catch (err) {
    console.error('회원가입 프록시 오류:', err);
    res.status(500).json({ message: '프록시 서버 오류', error: err.message });
  }
});

// 맵 저장 프록시
app.post('/proxy/map/save', (req, res) => {
  console.log('--- 맵 저장 요청 수신 ---');
  const bb = busboy({ headers: req.headers });
  const formData = new FormData();

  bb.on('file', (fieldname, file, info) => {
    console.log(`파일 수신: ${info.filename} (${info.mimeType})`);
    formData.append('file', file, {
      filename: info.filename,
      contentType: info.mimeType
    });
  });

  bb.on('field', (fieldname, val) => {
    if (fieldname === 'dto') {
      console.log('dto 필드 수신:', val);
      formData.append('dto', val, { contentType: 'application/json' });
    }
  });

  bb.on('close', async () => {
    try {
      const apiRes = await fetch('https://wc-piwm.onrender.com/map/save', {
        method: 'POST',
        headers: formData.getHeaders(),
        body: formData
      });

      const text = await apiRes.text();
      console.log('백엔드 응답 상태:', apiRes.status);
      console.log('백엔드 응답 본문:', text);

      if (!apiRes.ok) {
        return res.status(apiRes.status).json({ message: '맵 저장 실패', detail: text });
      }

      const contentType = apiRes.headers.get('content-type');
      const data = contentType?.includes('application/json') ? JSON.parse(text) : { message: text };
      res.status(apiRes.status).json(data);
    } catch (err) {
      console.error('맵 저장 프록시 오류:', err);
      res.status(500).json({ message: '프록시 서버 오류', error: err.message });
    }
  });

  req.pipe(bb);
});

// 맵 검색 프록시
app.post('/proxy/map/search', async (req, res) => {
  console.log('--- 맵 검색 요청 수신 ---');
  console.log('요청 내용:', req.body);

  try {
    const apiRes = await fetch('https://wc-piwm.onrender.com/map/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(req.body)
    });

    const text = await apiRes.text();
    console.log('백엔드 응답 상태:', apiRes.status);
    console.log('백엔드 응답 본문:', text);

    const contentType = apiRes.headers.get('content-type');
    const data = contentType?.includes('application/json') ? JSON.parse(text) : { message: text };
    res.status(apiRes.status).json(data);
  } catch (err) {
    console.error('맵 검색 프록시 오류:', err);
    res.status(500).json({ message: '프록시 서버 오류', error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`프록시 서버 실행 중 on port ${PORT}`));
