import React, { useState, useEffect } from 'react';
import { patterns } from './patternData';
import './PatternMemory.css';
import { Box, Typography, Grid, Card, CardActionArea, CardContent, Dialog, DialogTitle, DialogContent, DialogActions, Button, Snackbar, Alert } from '@mui/material';

function shuffle<T>(arr: T[]): T[] {
  return arr.slice().sort(() => Math.random() - 0.5);
}

export default function PatternMemory() {
  const [cards, setCards] = useState<any[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [showDesc, setShowDesc] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [openReward, setOpenReward] = useState(false);

  useEffect(() => {
    const pairs = shuffle([...patterns, ...patterns].map((p, i) => ({ ...p, key: i })));
    setCards(pairs);
  }, []);

  const handleFlip = (idx: number) => {
    if (flipped.length === 2 || flipped.includes(idx) || matched.includes(cards[idx].id)) return;
    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const [a, b] = newFlipped;
      if (cards[a].id === cards[b].id) {
        setTimeout(() => {
          setMatched([...matched, cards[a].id]);
          setShowDesc(cards[a].desc);
          setFlipped([]);
          if (matched.length + 1 === patterns.length) {
            setFinished(true);
            setOpenReward(true);
          }
        }, 800);
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  };

  return (
    <Box className="memory-game-container" sx={{ p: 2 }}>
      <Typography variant="h4" align="center" gutterBottom>契丹纹样翻翻看</Typography>
      <Grid container spacing={2} justifyContent="center" className="cards-grid">
        {cards.map((card, idx) => (
          <Grid item xs={3} sm={2} md={1.5} key={card.key}>
            <Card>
              <CardActionArea
                onClick={() => handleFlip(idx)}
                disabled={flipped.length === 2 || flipped.includes(idx) || matched.includes(card.id)}
                sx={{ minHeight: 100 }}
              >
                <Box sx={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: (flipped.includes(idx) || matched.includes(card.id)) ? 'background.paper' : 'grey.300' }}>
                  {(flipped.includes(idx) || matched.includes(card.id)) ? (
                    <img src={card.img} alt="pattern" style={{ maxHeight: 60, maxWidth: '100%' }} />
                  ) : null}
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Dialog open={!!showDesc} onClose={() => setShowDesc(null)}>
        <DialogTitle>纹样介绍</DialogTitle>
        <DialogContent>
          <Typography>{showDesc}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDesc(null)} autoFocus>知道了</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={openReward} autoHideDuration={3000} onClose={() => setOpenReward(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" sx={{ width: '100%' }}>全部配对成功！获得10积分</Alert>
      </Snackbar>
    </Box>
  );
} 