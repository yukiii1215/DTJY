const jwt = require('jsonwebtoken');

const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY;
const KLING_ACCESS_SECRET = process.env.KLING_ACCESS_SECRET;
const BASE_URL = 'https://api-beijing.klingai.com';

console.log('KLING_ACCESS_KEY:', KLING_ACCESS_KEY, 'KLING_ACCESS_SECRET:', KLING_ACCESS_SECRET);

// 工具函数：生成JWT Token
function generateToken() {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: KLING_ACCESS_KEY,
    exp: now + 1800,
    nbf: now - 5,
  };
  return jwt.sign(payload, KLING_ACCESS_SECRET, {
    algorithm: 'HS256',
    header: { alg: 'HS256', typ: 'JWT' },
  });
}

module.exports = async (req, res) => {
  // 1. 查询任务状态
  if (req.method === 'GET') {
    const { task_id } = req.query;
    if (!task_id) {
      res.status(400).json({ error: '缺少task_id参数' });
      return;
    }
    // 生成JWT Token
    const token = generateToken();

    // 查询任务
    const apiRes = await fetch(`${BASE_URL}/v1/images/generations/${task_id}`, {
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
    const {
      prompt, image, model_name, aspect_ratio, resolution, n,
      negative_prompt, image_reference, image_fidelity, human_fidelity, callback_url
    } = req.body;
    if (!prompt && !image) {
      res.status(400).json({ error: '缺少prompt或image参数' });
      return;
    }
    const token = generateToken();
    const body = {
      prompt,
      model_name,
      aspect_ratio,
      resolution,
      n,
      image,
      negative_prompt,
      image_reference,
      image_fidelity,
      human_fidelity,
      callback_url,
    };
    Object.keys(body).forEach(key => body[key] === undefined && delete body[key]);
    const apiRes = await fetch(`${BASE_URL}/v1/images/generations`, {
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