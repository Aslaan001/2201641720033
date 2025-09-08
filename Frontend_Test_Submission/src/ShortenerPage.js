import React, { useState } from 'react';
import { Box, TextField, Button, Grid, Typography, Paper } from '@mui/material';
import axios from 'axios';
import Log from 'logging-middleware';

const initialRows = [{ url: '', validity: '', shortcode: '' }];

export default function ShortenerPage() {
  const [rows, setRows] = useState(initialRows);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  const handleChange = (idx, field, value) => {
    const updated = [...rows];
    updated[idx][field] = value;
    setRows(updated);
  };

  const addRow = () => {
    if (rows.length < 5) setRows([...rows, { url: '', validity: '', shortcode: '' }]);
  };

  const validate = (row) => {
    try {
      new URL(row.url);
    } catch {
      return 'Invalid URL';
    }
    if (row.validity && (!Number.isInteger(Number(row.validity)) || Number(row.validity) <= 0)) {
      return 'Validity must be a positive integer';
    }
    if (row.shortcode && !/^[a-zA-Z0-9_-]{4,}$/.test(row.shortcode)) {
      return 'Shortcode must be at least 4 chars, alphanumeric/_-';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResults([]);
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const err = validate(row);
      if (err) {
        setError(`Row ${i + 1}: ${err}`);
        await Log('frontend', 'warn', 'handler', `Validation failed: ${err}`);
        return;
      }
    }
    try {
      const promises = rows.map(row =>
        axios.post('/shorturls', {
          url: row.url,
          validity: row.validity ? Number(row.validity) : undefined,
          shortcode: row.shortcode || undefined
        })
      );
      const resArr = await Promise.all(promises);
      setResults(resArr.map(r => r.data));
      await Log('frontend', 'info', 'handler', 'Short URLs created');
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating short URLs');
      await Log('frontend', 'error', 'handler', `Shorten error: ${err.message}`);
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          {rows.map((row, idx) => (
            <React.Fragment key={idx}>
              <Grid item xs={12} sm={6} md={5}>
                <TextField label="URL" value={row.url} onChange={e => handleChange(idx, 'url', e.target.value)} fullWidth required />
              </Grid>
              <Grid item xs={6} sm={3} md={2}>
                <TextField label="Validity (min)" value={row.validity} onChange={e => handleChange(idx, 'validity', e.target.value)} type="number" fullWidth />
              </Grid>
              <Grid item xs={6} sm={3} md={2}>
                <TextField label="Shortcode" value={row.shortcode} onChange={e => handleChange(idx, 'shortcode', e.target.value)} fullWidth />
              </Grid>
            </React.Fragment>
          ))}
          <Grid item xs={12}>
            <Button onClick={addRow} disabled={rows.length >= 5}>Add URL</Button>
            <Button type="submit" variant="contained" sx={{ ml: 2 }}>Shorten</Button>
          </Grid>
        </Grid>
      </form>
      {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
      {results.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">Shortened URLs</Typography>
          {results.map((r, i) => (
            <Paper key={i} sx={{ p: 2, my: 1 }}>
              <Typography>Short Link: <a href={r.shortLink} target="_blank" rel="noopener noreferrer">{r.shortLink}</a></Typography>
              <Typography>Expiry: {r.expiry}</Typography>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}
