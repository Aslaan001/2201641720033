import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText } from '@mui/material';
import axios from 'axios';
import Log from 'logging-middleware';

export default function StatsPage() {
  const [stats, setStats] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // For demo, fetch all shortcodes from backend (you may need a /shorturls/all endpoint)
        const res = await axios.get('/shorturls/all');
        setStats(res.data);
        await Log('frontend', 'info', 'handler', 'Stats loaded');
      } catch (err) {
        setError('Failed to load stats');
        await Log('frontend', 'error', 'handler', `Stats error: ${err.message}`);
      }
    };
    fetchStats();
  }, []);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6">Short URL Statistics</Typography>
      {error && <Typography color="error">{error}</Typography>}
      {stats.map((s, i) => (
        <Paper key={i} sx={{ p: 2, my: 2 }}>
          <Typography>Short Link: <a href={s.shortLink} target="_blank" rel="noopener noreferrer">{s.shortLink}</a></Typography>
          <Typography>Original URL: {s.url}</Typography>
          <Typography>Created: {new Date(s.createdAt).toLocaleString()}</Typography>
          <Typography>Expiry: {new Date(s.expiry).toLocaleString()}</Typography>
          <Typography>Total Clicks: {s.clickCount}</Typography>
          <Typography>Click Details:</Typography>
          <List dense>
            {s.clicks.map((c, j) => (
              <ListItem key={j}>
                <ListItemText primary={`Time: ${new Date(c.timestamp).toLocaleString()} | Referrer: ${c.referrer || 'N/A'} | Geo: ${c.geo || 'N/A'}`} />
              </ListItem>
            ))}
          </List>
        </Paper>
      ))}
    </Box>
  );
}
