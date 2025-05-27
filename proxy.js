const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const busboy = require('busboy');
const FormData = require('form-data');
const app = express();

// CORS 설정
app.use(cors({
  origin: 'https://webcraftpc.com',
  credentials: true
}));

// OPTIONS 프리플라이트 대응
app.options('/proxy/*', cors({
  origin: 'https://webcraftpc.com',
  credentials: true
}));

app.use(express.json());

// 로그인 프록시
app.post('/proxy/login', async (req, res) => {
  const debugLog = { route: '/proxy/login', requestBody: req.body };
  console.log('[프록시 요청 쿠키]', req.headers.cookie || '(없음)');
  try {
    const apiRes = await fetch('https://wc-piwm.onrender.com/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const setCookie = apiRes.headers.raw()['set-cookie'];
    if (setCookie) {
      console.log('[쿠키 디버그] 백엔드로부터 받은 Set-Cookie:', setCookie);
      setCookie.forEach(cookie => res.append('Set-Cookie', cookie));
      res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');
    }
    const text = await apiRes.text();
    const data = apiRes.headers.get('content-type')?.includes('application/json') ? JSON.parse(text) : { message: text };
    debugLog.status = apiRes.status;
    debugLog.rawResponse = text;
    res.status(apiRes.status).json({ ...data, debugLog });
  } catch (err) {
    debugLog.error = err.message;
    console.error('[프록시 오류 - 로그인]', debugLog);
    res.status(500).json({ message: '프록시 서버 오류', error: err.message, debugLog });
  }
});

// 회원가입 프록시
app.post('/proxy/signUp', async (req, res) => {
  const debugLog = { route: '/proxy/signUp', requestBody: req.body, cookies: req.headers.cookie || null };
  try {
    const apiRes = await fetch('https://wc-piwm.onrender.com/signUp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cookie': req.headers.cookie || ''
      },
      body: JSON.stringify(req.body)
    });
    const text = await apiRes.text();
    const data = apiRes.headers.get('content-type')?.includes('application/json') ? JSON.parse(text) : { message: text };
    debugLog.status = apiRes.status;
    debugLog.rawResponse = text;
    res.status(apiRes.status).json({ ...data, debugLog });
  } catch (err) {
    debugLog.error = err.message;
    console.error('[프록시 오류 - 회원가입]', debugLog);
    res.status(500).json({ message: '프록시 서버 오류', error: err.message, debugLog });
  }
});

// 맵 저장 프록시
app.post('/proxy/map/save', (req, res) => {
  const debugLog = {
    route: '/proxy/map/save',
    cookies: req.headers.cookie || null,
    fields: {},
    files: []
  };

  const bb = busboy({ headers: req.headers });
  const formData = new FormData();
  const filePromises = [];

  req.on('error', (err) => {
    debugLog.error = '요청 스트림 에러: ' + err.message;
    console.error('[프록시 오류 - 요청 스트림]', debugLog);
    res.status(500).json({ message: '요청 스트림 에러', error: err.message, debugLog });
  });

  bb.on('error', (err) => {
    debugLog.error = '버스보이 에러: ' + err.message;
    console.error('[프록시 오류 - busboy]', debugLog);
    res.status(500).json({ message: 'busboy 오류', error: err.message, debugLog });
  });

  bb.on('file', (fieldname, file, info) => {
    const buffers = [];
    const filePromise = new Promise((resolve, reject) => {
      file.on('data', data => buffers.push(data));
      file.on('end', () => {
        const buffer = Buffer.concat(buffers);
        formData.append(fieldname, buffer, {
          filename: info.filename,
          contentType: info.mimeType
        });
        debugLog.files.push({ filename: info.filename, mimeType: info.mimeType });
        resolve();
      });
      file.on('error', reject);
    });
    filePromises.push(filePromise);
  });

  bb.on('field', (fieldname, val) => {
    if (fieldname === 'dto') {
      formData.append('dto', val, { contentType: 'application/json' });
    } else {
      formData.append(fieldname, val);
    }
    debugLog.fields[fieldname] = val;
  });

  bb.on('close', async () => {
    try {
      await Promise.all(filePromises);

      const apiRes = await fetch('https://wc-piwm.onrender.com/map/save', {
        method: 'POST',
        headers: {
          ...formData.getHeaders(),
          cookie: req.headers.cookie || ''
        },
        body: formData
      });

      const text = await apiRes.text();
      const isJson = apiRes.headers.get('content-type')?.includes('application/json');
      const data = isJson ? JSON.parse(text) : { message: text };

      debugLog.status = apiRes.status;
      debugLog.rawResponse = text;

      res.status(apiRes.status).json({ ...data, debugLog });

    } catch (err) {
      debugLog.error = err.message;
      console.error('[프록시 오류 - 맵 저장]', debugLog);
      res.status(500).json({ message: '프록시 서버 오류', error: err.message, debugLog });
    }
  });

  req.pipe(bb);
});

// 맵 검색 프록시
app.post('/proxy/map/search', async (req, res) => {
  const debugLog = { route: '/proxy/map/search', requestBody: req.body, cookies: req.headers.cookie || null };
  try {
    const apiRes = await fetch('https://wc-piwm.onrender.com/map/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cookie': req.headers.cookie || ''
      },
      body: JSON.stringify(req.body)
    });
    const text = await apiRes.text();
    const data = apiRes.headers.get('content-type')?.includes('application/json') ? JSON.parse(text) : { message: text };
    debugLog.status = apiRes.status;
    debugLog.rawResponse = text;
    res.status(apiRes.status).json({ ...data, debugLog });
  } catch (err) {
    debugLog.error = err.message;
    console.error('[프록시 오류 - 맵 검색]', debugLog);
    res.status(500).json({ message: '프록시 서버 오류', error: err.message, debugLog });
  }
});

// ping 확인용
app.get('/proxy/ping', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://webcraftpc.com');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  fetch('https://wc-piwm.onrender.com/ping', { method: 'HEAD', timeout: 5000 })
    .then(response => {
      res.status(200).json({ proxy: 'online', backend: response.ok ? 'online' : 'offline' });
    })
    .catch(error => {
      console.error('[프록시 /proxy/ping 오류]', error.message);
      res.status(200).json({ proxy: 'online', backend: 'offline' });
    });
});

app.all('/', (req, res) => {
  res.status(200).send('Proxy server is live');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` 프록시 서버 실행 중 (포트: ${PORT})`);
});

