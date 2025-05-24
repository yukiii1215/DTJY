const jwt = require('jsonwebtoken');

const ACCESS_KEY_ID = process.env.KLING_ACCESS_KEY_ID;
const ACCESS_KEY_SECRET = process.env.KLING_ACCESS_KEY_SECRET;

module.exports = async (req, res) => {
  // 1. 查询任务状态
  if (req.method === 'GET') {
    const { task_id } = req.query;
    if (!task_id) {
      res.status(400).json({ error: '缺少task_id参数' });
      return;
    }
    // 生成JWT Token
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: ACCESS_KEY_ID,
      exp: now + 1800,
      nbf: now - 5,
    };
    const token = jwt.sign(payload, ACCESS_KEY_SECRET, { algorithm: 'HS256', header: { alg: 'HS256', typ: 'JWT' } });

    // 查询任务
    const apiRes = await fetch(`https://api.klingai.com/v1/images/generations/${task_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await apiRes.json();
    res.status(apiRes.status).json(data);
    return;
  }

  // 2. 创建任务
  if (req.method === 'POST') {
    const { prompt, style, image } = req.body;
    if (!prompt && !image) {
      res.status(400).json({ error: '缺少prompt或image参数' });
      return;
    }
    // 生成JWT Token
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: ACCESS_KEY_ID,
      exp: now + 1800,
      nbf: now - 5,
    };
    const token = jwt.sign(payload, ACCESS_KEY_SECRET, { algorithm: 'HS256', header: { alg: 'HS256', typ: 'JWT' } });

    // 拼接prompt
    const finalPrompt = prompt && style ? `${style}，${prompt}` : prompt || '';
    const body = {
      prompt: finalPrompt,
      aspect_ratio: '1:1',
      n: 1,
      model_name: 'kling-v1',
    };
    if (image) {
      body.image = image;
    }

    // 创建任务
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
    return;
  }

  // 其他方法不允许
  res.status(405).json({ error: 'Method Not Allowed' });
}; 