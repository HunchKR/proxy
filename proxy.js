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
  const debugLog = {
    route: '/proxy/login',
    requestBody: req.body
  };

  console.log('[프록시 요청 쿠키]', req.headers.cookie || '(없음)');

  try {
    const apiRes = await fetch('https://wc-piwm.onrender.com/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const setCookie = apiRes.headers.raw()['set-cookie'];
    if (setCookie) {
      console.log('[쿠키 디버그] 백엔드로부터 받은 Set-Cookie:', setCookie);
      const cookieArray = Array.isArray(setCookie) ? setCookie : [setCookie];
      cookieArray.forEach(cookie => res.append('Set-Cookie', cookie));
      res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');
    } else {
      console.warn('[쿠키 경고] 백엔드에서 Set-Cookie 헤더가 없음!');
    }

    const text = await apiRes.text();
    debugLog.status = apiRes.status;
    debugLog.rawResponse = text;

    const contentType = apiRes.headers.get('content-type');
    const data = contentType?.includes('application/json') ? JSON.parse(text) : { message: text };

    console.log('[디버그 로그]', debugLog);
    res.status(apiRes.status).json({ ...data, debugLog });
  } catch (err) {
    debugLog.error = err.message;
    console.error('[프록시 오류 - 로그인]', debugLog);
    res.status(500).json({ message: '프록시 서버 오류', error: err.message, debugLog });
  }
});

// 회원가입 프록시
app.post('/proxy/signUp', async (req, res) => {
  const debugLog = {
    route: '/proxy/signUp',
    requestBody: req.body,
    cookies: req.headers.cookie || null
  };

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
    debugLog.status = apiRes.status;
    debugLog.rawResponse = text;

    const contentType = apiRes.headers.get('content-type');
    const data = contentType?.includes('application/json') ? JSON.parse(text) : { message: text };

    console.log('[디버그 로그]', debugLog);
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

  console.log('[프록시 요청 쿠키] /proxy/map/save:', req.headers.cookie || '(없음)');

  const bb = busboy({ headers: req.headers });
  const formData = new FormData();

  bb.on('file', (fieldname, file, info) => {
    debugLog.files.push({ filename: info.filename, mimeType: info.mimeType });
    formData.append('file', file, {
      filename: info.filename,
      contentType: info.mimeType
    });
  });

  bb.on('field', (fieldname, val) => {
    debugLog.fields[fieldname] = val;
    if (fieldname === 'dto') {
      formData.append('dto', val, { contentType: 'application/json' });
    }
  });

  bb.on('close', async () => {
    try {
      const apiRes = await fetch('https://wc-piwm.onrender.com/map/save', {
        method: 'POST',
        headers: {
          ...formData.getHeaders(),
          'cookie': req.headers.cookie || ''
        },
        body: formData
      });

      const text = await apiRes.text();
      debugLog.status = apiRes.status;
      debugLog.rawResponse = text;

      if (apiRes.status === 401 || apiRes.status === 403) {
        console.log('[디버그 로그]', debugLog);
        return res.status(apiRes.status).json({ message: '로그인이 필요합니다.', debugLog });
      }

      const contentType = apiRes.headers.get('content-type');
      const data = contentType?.includes('application/json') ? JSON.parse(text) : { message: text };

      console.log('[디버그 로그]', debugLog);
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
  const debugLog = {
    route: '/proxy/map/search',
    requestBody: req.body,
    cookies: req.headers.cookie || null
  };

  console.log('[프록시 요청 쿠키] /proxy/map/search:', req.headers.cookie || '(없음)');

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
    debugLog.status = apiRes.status;
    debugLog.rawResponse = text;

    if (apiRes.status === 401 || apiRes.status === 403) {
      console.log('[디버그 로그]', debugLog);
      return res.status(apiRes.status).json({ message: '로그인이 필요합니다.', debugLog });
    }

    const contentType = apiRes.headers.get('content-type');
    const data = contentType?.includes('application/json') ? JSON.parse(text) : { message: text };

    console.log('[디버그 로그]', debugLog);
    res.status(apiRes.status).json({ ...data, debugLog });
  } catch (err) {
    debugLog.error = err.message;
    console.error('[프록시 오류 - 맵 검색]', debugLog);
    res.status(500).json({ message: '프록시 서버 오류', error: err.message, debugLog });
  }
});

// 1️ 라우트 먼저 정의
app.all('/', (req, res) => {
  res.status(200).send('Proxy server is live');
});



app.get('/proxy/ping', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://webcraftpc.com');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  try {
    const backendRes = await fetch('https://wc-piwm.onrender.com/ping', {
      method: 'HEAD',
      timeout: 5000, // 타임아웃 명시적으로 지정
    });

    const backendOnline = backendRes.ok;

    res.status(200).json({
      proxy: 'online',
      backend: backendOnline ? 'online' : 'offline',
    });
  } catch (err) {
    console.error('[프록시 /proxy/ping 오류]', err.message);

    res.status(200).json({
      proxy: 'online',
      backend: 'offline',
    });
  }
});


// 2 마지막에 listen
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` 프록시 서버 실행 중 (포트: ${PORT})`);
});
