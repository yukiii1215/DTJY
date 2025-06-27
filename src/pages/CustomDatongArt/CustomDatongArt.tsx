import React, { useRef, useState } from 'react';
import { Box, Typography, Paper, Button, TextField, Select, MenuItem, FormControl, InputLabel, Grid, Divider, CircularProgress, Alert } from '@mui/material';
import { ReactSketchCanvas } from 'react-sketch-canvas';

const kitanStyles = [
  '传统契丹纹样',
  '现代简约风',
  '花卉图案',
  '几何图案',
];

const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 320;

// 检查 base64 PNG 是否有足够有效像素
async function hasEnoughValidPixels(base64: string, minCount = 1000): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(false);
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height).data;
      let count = 0;
      for (let i = 0; i < imageData.length; i += 4) {
        const [r, g, b, a] = [
          imageData[i],
          imageData[i + 1],
          imageData[i + 2],
          imageData[i + 3],
        ];
        if (a > 0 && !(r === 255 && g === 255 && b === 255)) {
          count++;
        }
      }
      resolve(count >= minCount);
    };
    img.onerror = () => resolve(false);
    img.src = 'data:image/png;base64,' + base64;
  });
}

const CustomDatongArt: React.FC = () => {
  const [style, setStyle] = useState(kitanStyles[0]);
  const [prompt, setPrompt] = useState('');
  const [img, setImg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canvasImage, setCanvasImage] = useState<string | null>(null); // base64
  const [uploadImage, setUploadImage] = useState<string | null>(null); // base64
  const canvasRef = useRef<any>(null);

  // 拼接最终prompt
  const getFinalPrompt = () => `${style}，${prompt}`;

  // 轮询任务状态
  const pollTask = async (taskId: string, retry = 0) => {
    if (retry > 30) {
      setLoading(false);
      setError('生成超时，请重试');
      return;
    }
    try {
      const res = await fetch(`/api/kling-generate?task_id=${taskId}`);
      const data = await res.json();
      if (data.code !== 0) {
        setLoading(false);
        setError(data.message || '生成失败');
        return;
      }
      if (data.data.task_status === 'succeed') {
        const url = data.data.task_result?.images?.[0]?.url;
        if (url) {
          setImg(url);
          setLoading(false);
        } else {
          setError('未获取到图片结果');
          setLoading(false);
        }
      } else if (data.data.task_status === 'failed') {
        setError(data.data.task_status_msg || '生成失败');
        setLoading(false);
      } else {
        setTimeout(() => pollTask(taskId, retry + 1), 2000);
      }
    } catch (e) {
      setLoading(false);
      setError('网络错误');
    }
  };

  // 生成图片
  const handleGenerate = async () => {
    setError(null);
    setImg(null);
    let imageBase64 = null;
    let aspectRatio = '1:1'; // 默认
    // 直接导出画布内容
    if (canvasRef.current) {
      try {
        // 先导出PNG
        const dataUrl = await canvasRef.current.exportImage('png');
        const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
        if (dataUrl.length < 1000) {
          setError('请在画布上绘制内容后再生成');
          setLoading(false);
          return;
        }
        // 新增：像素数量检测
        const enough = await hasEnoughValidPixels(base64, 1000);
        if (!enough) {
          setError('请多画一些内容后再生成（建议线条粗一些、面积大一些）');
          setLoading(false);
          return;
        }
        // 新增：将PNG转为JPEG，确保无透明像素
        const img = new window.Image();
        img.src = dataUrl;
        await new Promise((resolve) => { img.onload = resolve; });
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        // 自动设置 aspect_ratio
        if (canvas.width && canvas.height) {
          const ratio = canvas.width / canvas.height;
          if (Math.abs(ratio - 1) < 0.01) aspectRatio = '1:1';
          else if (Math.abs(ratio - 16/9) < 0.01) aspectRatio = '16:9';
          else if (Math.abs(ratio - 4/3) < 0.01) aspectRatio = '4:3';
          else if (Math.abs(ratio - 3/2) < 0.01) aspectRatio = '3:2';
          else if (Math.abs(ratio - 2/3) < 0.01) aspectRatio = '2:3';
          else if (Math.abs(ratio - 3/4) < 0.01) aspectRatio = '3:4';
          else if (Math.abs(ratio - 9/16) < 0.01) aspectRatio = '9:16';
          else if (Math.abs(ratio - 21/9) < 0.01) aspectRatio = '21:9';
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, canvas.width, canvas.height); // 白色背景
          ctx.drawImage(img, 0, 0);
          // 尝试导出为JPEG
          const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);
          imageBase64 = jpegDataUrl.replace(/^data:image\/jpeg;base64,/, '');
        } else {
          imageBase64 = base64;
        }
      } catch (e) {}
    }
    if (!imageBase64 && uploadImage) {
      // 校验上传图片base64长度
      const base64 = uploadImage.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
      if (base64.length < 1000) {
        setError('上传的图片内容无效，请更换图片');
        setLoading(false);
        return;
      }
      // 新增：像素数量检测
      const enough = await hasEnoughValidPixels(base64, 1000);
      if (!enough) {
        setError('上传的图片内容无效，请更换图片（建议内容丰富一些）');
        setLoading(false);
        return;
      }
      imageBase64 = base64;
      // 上传图片时也自动设置 aspect_ratio
      const img = new window.Image();
      img.src = 'data:image/png;base64,' + base64;
      await new Promise((resolve) => { img.onload = resolve; });
      if (img.width && img.height) {
        const ratio = img.width / img.height;
        if (Math.abs(ratio - 1) < 0.01) aspectRatio = '1:1';
        else if (Math.abs(ratio - 16/9) < 0.01) aspectRatio = '16:9';
        else if (Math.abs(ratio - 4/3) < 0.01) aspectRatio = '4:3';
        else if (Math.abs(ratio - 3/2) < 0.01) aspectRatio = '3:2';
        else if (Math.abs(ratio - 2/3) < 0.01) aspectRatio = '2:3';
        else if (Math.abs(ratio - 3/4) < 0.01) aspectRatio = '3:4';
        else if (Math.abs(ratio - 9/16) < 0.01) aspectRatio = '9:16';
        else if (Math.abs(ratio - 21/9) < 0.01) aspectRatio = '21:9';
      }
    }
    if (!prompt.trim() && !imageBase64) {
      setError('请输入创意描述或绘制/上传图片');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/kling-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'generate',
          prompt: getFinalPrompt(),
          image: imageBase64 || undefined,
          model_name: 'kling-v1',
          aspect_ratio: aspectRatio,
          resolution: '1k',
          n: 1
        }),
      });
      const data = await res.json();
      if (data.code !== 0) {
        setError(data.message || '生成失败');
        setLoading(false);
        return;
      }
      const taskId = data.data.task_id;
      pollTask(taskId);
    } catch (e) {
      setError('网络错误');
      setLoading(false);
    }
  };

  // 清空画布
  const handleClear = () => {
    canvasRef.current?.clearCanvas();
    setCanvasImage(null);
  };

  // 上传图片
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 画布导出预览
  const handleSaveCanvas = async () => {
    if (canvasRef.current) {
      const dataUrl = await canvasRef.current.exportImage('png');
      setCanvasImage(dataUrl);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" align="center" gutterBottom>定制你的大同结艺</Typography>
      <Typography align="center" color="text.secondary" sx={{ mb: 3 }}>
        在下方画布自由绘制，或输入描述，选择契丹纹样风格，生成专属你的大同结艺！
      </Typography>
      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>画布（可自由绘制或上传图片）</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <ReactSketchCanvas
                ref={canvasRef}
                width="320"
                height="320"
                style={{ borderRadius: 8, boxShadow: '0 1px 4px #eee', border: '1px solid #eee' }}
                strokeWidth={3}
                strokeColor="#333"
                backgroundImage={uploadImage || undefined}
          
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button variant="outlined" color="secondary" onClick={handleClear}>清空画布</Button>
              <Button variant="outlined" component="label" color="primary">
                上传图片
                <input type="file" accept="image/*" hidden onChange={handleUpload} />
              </Button>
              <Button variant="outlined" color="info" onClick={handleSaveCanvas}>预览画布</Button>
            </Box>
            {canvasImage && (
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="caption">画布预览：</Typography>
                <img src={canvasImage} alt="画布预览" style={{ maxWidth: 160, maxHeight: 160, borderRadius: 8 }} />
              </Box>
            )}
            {uploadImage && (
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="caption">上传图片预览：</Typography>
                <img src={uploadImage} alt="上传图片" style={{ maxWidth: 160, maxHeight: 160, borderRadius: 8 }} />
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>文生图（输入描述）</Typography>
            <TextField
              label="请输入你的创意描述"
              multiline
              minRows={3}
              fullWidth
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>契丹纹样风格</InputLabel>
              <Select
                value={style}
                label="契丹纹样风格"
                onChange={e => setStyle(e.target.value)}
              >
                {kitanStyles.map(s => <MenuItem value={s} key={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="contained" color="primary" fullWidth onClick={handleGenerate} disabled={loading}>
              {loading ? <CircularProgress size={24} color="inherit" /> : '生成专属大同结艺'}
            </Button>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </Paper>
        </Grid>
      </Grid>
      <Divider sx={{ my: 4 }}>生成结果</Divider>
      <Box sx={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fafafa', borderRadius: 2 }}>
        {loading ? (
          <CircularProgress />
        ) : img ? (
          <img src={img} alt="生成结果" style={{ maxWidth: '100%', maxHeight: 320 }} />
        ) : (
          <Typography color="text.secondary">生成结果将在这里展示</Typography>
        )}
      </Box>
    </Box>
  );
};

export default CustomDatongArt; 