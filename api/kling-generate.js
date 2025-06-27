const jwt = require('jsonwebtoken');

const ACCESS_KEY_ID = process.env.KLING_ACCESS_KEY_ID;
const ACCESS_KEY_SECRET = process.env.KLING_ACCESS_KEY_SECRET;
const BASE_URL = 'https://api-beijing.klingai.com';

// 工具函数：生成JWT Token
function generateToken() {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: ACCESS_KEY_ID,
    exp: now + 1800,
    nbf: now - 5,
  };
  return jwt.sign(payload, ACCESS_KEY_SECRET, {
    algorithm: 'HS256',
    header: { alg: 'HS256', typ: 'JWT' },
  });
}

module.exports = async (req, res) => {
  // 1. 查询任务状态
  if (req.method === 'GET') {
    const { type = 'generate', task_id, pageNum, pageSize } = req.query;
    if (!task_id && type !== 'list') {
      res.status(400).json({ error: '缺少task_id参数' });
      return;
    }
    const token = generateToken();
    let url = '';
    if (type === 'generate') {
      url = task_id
        ? `${BASE_URL}/v1/images/generations/${task_id}`
        : `${BASE_URL}/v1/images/generations?pageNum=${pageNum || 1}&pageSize=${pageSize || 30}`;
    } else if (type === 'expand') {
      url = task_id
        ? `${BASE_URL}/v1/images/editing/expand/${task_id}`
        : `${BASE_URL}/v1/images/editing/expand?pageNum=${pageNum || 1}&pageSize=${pageSize || 30}`;
    } else {
      res.status(400).json({ error: 'type参数非法' });
      return;
    }
    const apiRes = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await apiRes.json();
    res.status(apiRes.status).json(data);
    return;
  }

  // 2. 创建任务
  if (req.method === 'POST') {
    const { type = 'generate', ...bodyParams } = req.body;
    const token = generateToken();
    let url = '';
    let body = {};
    if (type === 'generate') {
      // 图像生成
      const {
        prompt,
        style,
        image,
        negative_prompt,
        model_name = 'kling-v1',
        aspect_ratio = '16:9',
        n = 1,
        resolution = '1k',
        image_reference,
        image_fidelity,
        human_fidelity,
        callback_url,
      } = bodyParams;
      if (!prompt && !image) {
        res.status(400).json({ error: '缺少prompt或image参数' });
        return;
      }
      const finalPrompt = prompt && style ? `${style}，${prompt}` : prompt || '';
      body = {
        prompt: finalPrompt,
        model_name,
        aspect_ratio,
        n,
        resolution,
      };
      if (image) body.image = image;
      if (negative_prompt && !image) body.negative_prompt = negative_prompt;
      if (image_reference) body.image_reference = image_reference;
      if (image_fidelity !== undefined) body.image_fidelity = image_fidelity;
      if (human_fidelity !== undefined) body.human_fidelity = human_fidelity;
      if (callback_url) body.callback_url = callback_url;
      url = `${BASE_URL}/v1/images/generations`;
    } else if (type === 'expand') {
      // 扩图
      const {
        image,
        up_expansion_ratio = 0,
        down_expansion_ratio = 0,
        left_expansion_ratio = 0,
        right_expansion_ratio = 0,
        prompt,
        n = 1,
        callback_url,
        external_task_id,
      } = bodyParams;
      if (!image) {
        res.status(400).json({ error: '缺少image参数' });
        return;
      }
      body = {
        image,
        up_expansion_ratio,
        down_expansion_ratio,
        left_expansion_ratio,
        right_expansion_ratio,
        n,
      };
      if (prompt) body.prompt = prompt;
      if (callback_url) body.callback_url = callback_url;
      if (external_task_id) body.external_task_id = external_task_id;
      url = `${BASE_URL}/v1/images/editing/expand`;
    } else {
      res.status(400).json({ error: 'type参数非法' });
      return;
    }
    const apiRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
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