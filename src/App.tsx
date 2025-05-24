import React from 'react';
import Intro from './pages/Intro/Intro';
import KnotGame from './pages/KnotGame/KnotGame';
import PatternMemory from './pages/PatternMemory/PatternMemory';
import { useState } from 'react';

function App() {
  const [page, setPage] = useState('intro');

  return (
    <div>
      <nav style={{ display: 'flex', justifyContent: 'center', gap: 16, margin: 16 }}>
        <button onClick={() => setPage('intro')}>文化介绍</button>
        <button onClick={() => setPage('knot')}>盘扣绳结</button>
        <button onClick={() => setPage('memory')}>纹样翻翻看</button>
      </nav>
      {page === 'intro' && <Intro />}
      {page === 'knot' && <KnotGame />}
      {page === 'memory' && <PatternMemory />}
    </div>
  );
}

export default App;
