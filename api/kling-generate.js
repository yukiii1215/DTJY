const jwt = require('jsonwebtoken');

const ACCESS_KEY_ID = process.env.KLING_ACCESS_KEY_ID;
const ACCESS_KEY_SECRET = process.env.KLING_ACCESS_KEY_SECRET;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { prompt, style, image } = req.body;
  if (!prompt && !image) {
    res.status(400).json({ error: '缺少prompt或image参数' });
    return;
  }

  // 1. 生成JWT Token
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: ACCESS_KEY_ID,
    exp: now + 1800, // 30分钟有效
    nbf: now - 5,
  };
  const token = jwt.sign(payload, ACCESS_KEY_SECRET, { algorithm: 'HS256', header: { alg: 'HS256', typ: 'JWT' } });

  // 2. 拼接最终prompt
  const finalPrompt = prompt && style ? `${style}，${prompt}` : prompt || '';

  // 3. 构造请求体
  const body = {
    prompt: finalPrompt,
    aspect_ratio: '1:1',
    n: 1,
    model_name: 'kling-v1',
  };
  if (image) {
    body.image = image;
  }

  // 4. 调用可灵AI接口
  const apiRes = await fetch('https://api.klingai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await apiRes.json();
  res.status(apiRes.status).json(data);
}; 