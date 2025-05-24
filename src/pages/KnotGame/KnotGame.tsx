import React, { useState } from 'react';
import { knotSteps } from './knotSteps';
import './KnotGame.css';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Paper } from '@mui/material';

export default function KnotGame() {
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const [openReward, setOpenReward] = useState(false);

  // 简单滑动检测（可用第三方库增强）
  const handleNext = () => {
    if (step < knotSteps.length - 1) setStep(step + 1);
    else {
      setFinished(true);
      setOpenReward(true);
    }
  };

  return (
    <Box className="knot-game-container" sx={{ p: 2 }}>
      <Typography variant="h4" align="center" gutterBottom>盘扣绳结教学</Typography>
      <Paper elevation={3} sx={{ p: 2, mb: 2, textAlign: 'center' }}>
        <Box className="knot-lottie" sx={{ mb: 2 }}>
          <video src={knotSteps[step].animation} autoPlay loop muted playsInline style={{ width: '100%', borderRadius: 8 }} />
        </Box>
        <Typography variant="body1" sx={{ mb: 2 }}>{knotSteps[step].tip}</Typography>
        <Button variant="contained" color="primary" className="knot-btn" onClick={handleNext} fullWidth>滑动/点击完成本步</Button>
      </Paper>
      <Snackbar open={openReward} autoHideDuration={3000} onClose={() => setOpenReward(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" sx={{ width: '100%' }}>恭喜完成！获得10积分</Alert>
      </Snackbar>
    </Box>
  );
} 