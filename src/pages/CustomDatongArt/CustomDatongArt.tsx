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

// 新增：原生Canvas组件
const NativeCanvas: React.FC<{ onExport: (base64: string) => void, uploadImage: string | null }> = ({ onExport, uploadImage }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);

  // 加载上传图片为背景
  React.useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      if (uploadImage) {
        const img = new window.Image();
        img.onload = function () {
          ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        };
        img.src = uploadImage;
      }
    }
  }, [uploadImage]);

  // 移动端触摸事件
  const getTouchPos = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    setDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      const { x, y } = getTouchPos(e);
      ctx.moveTo(x, y);
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      const { x, y } = getTouchPos(e);
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    e.preventDefault(); // 防止页面滚动
  };
  const handleTouchEnd = () => setDrawing(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  };
  const handleMouseUp = () => setDrawing(false);
  const handleClear = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  };
  const handleExport = () => {
    const base64 = canvasRef.current?.toDataURL('image/jpeg', 0.92).replace(/^data:image\/jpeg;base64,/, '');
    if (base64) onExport(base64);
  };
  return (
    <div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{ border: '1px solid #eee', borderRadius: 8, background: '#fff', cursor: 'crosshair' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      />
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <Button variant="outlined" color="secondary" onClick={handleClear}>清空画布</Button>
        <Button variant="outlined" color="info" onClick={handleExport}>预览画布</Button>
      </div>
    </div>
  );
};

const CustomDatongArt: React.FC = () => {
  const [style, setStyle] = useState(kitanStyles[0]);
  const [prompt, setPrompt] = useState('');
  const [img, setImg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canvasImage, setCanvasImage] = useState<string | null>(null); // base64
  const [uploadImage, setUploadImage] = useState<string | null>(null); // base64
  const [canvasBase64, setCanvasBase64] = useState<string | null>(null);
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
    let imageBase64 = canvasBase64;
    let aspectRatio = '1:1'; // 默认
    // 只用canvasBase64
    if (!imageBase64 && uploadImage) {
      // 兼容直接上传图片
      const base64 = uploadImage.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
      imageBase64 = base64;
      // ...宽高比检测同前...
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
              <NativeCanvas onExport={setCanvasBase64} uploadImage={uploadImage} />
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