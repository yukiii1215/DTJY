import React from 'react';
import { introImages, introText, introMedia } from './introData';
import ReactMarkdown from 'react-markdown';
import './Intro.css';
import { Box, Typography, Paper, Grid, Card, CardMedia, CardContent, Divider } from '@mui/material';

export default function Intro() {
  return (
    <Box className="intro-container" sx={{ p: 2 }}>
      <Typography variant="h3" align="center" gutterBottom>大同结艺与契丹纹样</Typography>
      <Grid container spacing={2} className="carousel" justifyContent="center" sx={{ mb: 2 }}>
        {introImages.map((img, i) => (
          <Grid item xs={12} sm={6} md={4} key={i} className="carousel-item">
            <Card>
              <CardMedia component="img" image={img.src} alt={img.desc} sx={{ height: 180, objectFit: 'cover' }} />
              <CardContent>
                <Typography variant="body2" color="text.secondary">{img.desc}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Paper elevation={2} sx={{ p: 2, mb: 2 }} className="intro-text">
        <ReactMarkdown>{introText}</ReactMarkdown>
      </Paper>
      <Divider sx={{ my: 2 }}>多媒体资料</Divider>
      <Grid container spacing={2} className="media-section">
        {introMedia.map((m, i) =>
          m.type === 'audio' ? (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1">{m.title}</Typography>
                <audio controls src={m.src} style={{ width: '100%' }}></audio>
              </Paper>
            </Grid>
          ) : (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1">{m.title}</Typography>
                <video controls width="100%" src={m.src} style={{ borderRadius: 8 }}></video>
              </Paper>
            </Grid>
          )
        )}
      </Grid>
    </Box>
  );
} 