import React from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme, Button, Container } from '@mui/material';
import Navbar from './components/Navbar';
import './App.css';
import Intro from './pages/Intro/Intro';
import KnotGame from './pages/KnotGame/KnotGame';
import PatternMemory from './pages/PatternMemory/PatternMemory';
import CustomDatongArt from './pages/CustomDatongArt/CustomDatongArt';
import { useState } from 'react';

// 创建主题
const theme = createTheme({
  palette: {
    primary: {
      main: '#FE6B8B',
    },
    secondary: {
      main: '#FF8E53',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Ma Shan Zheng"',
    ].join(','),
  },
});

function App() {
  const [page, setPage] = useState('intro');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
            <Button
              variant={page === 'intro' ? 'contained' : 'outlined'}
              onClick={() => setPage('intro')}
              color="primary"
            >
              文化介绍
            </Button>
            <Button
              variant={page === 'knot' ? 'contained' : 'outlined'}
              onClick={() => setPage('knot')}
              color="primary"
            >
              盘扣绳结
            </Button>
            <Button
              variant={page === 'memory' ? 'contained' : 'outlined'}
              onClick={() => setPage('memory')}
              color="primary"
            >
              纹样翻翻看
            </Button>
            <Button
              variant={page === 'custom' ? 'contained' : 'outlined'}
              onClick={() => setPage('custom')}
              color="secondary"
            >
              定制你的大同结艺
            </Button>
          </Box>
          <Box component="main">
            {page === 'intro' && <Intro />}
            {page === 'knot' && <KnotGame />}
            {page === 'memory' && <PatternMemory />}
            {page === 'custom' && <CustomDatongArt />}
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
