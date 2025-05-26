const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const busboy = require('busboy');
const FormData = require('form-data');
const app = express();

app.use(cors({
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
      res.setHeader('Set-Cookie', Array.isArray(setCookie) ? setCookie : [setCookie]);
      res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');
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

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`프록시 서버 실행 중 on port ${PORT}`));

// 루트 응답
app.get('/', (req, res) => {
  res.status(200).send('Proxy server is live');
});

app.head('/', (req, res) => {
  res.sendStatus(200);
});
