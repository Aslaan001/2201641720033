import React, { useEffect } from 'react';
import { Container, Typography, Box, Tabs, Tab } from '@mui/material';
import ShortenerPage from './ShortenerPage';
import StatsPage from './StatsPage';
import Log from 'logging-middleware';

function App() {
  const [tab, setTab] = React.useState(0);

  useEffect(() => {
    Log('frontend', 'info', 'middleware', 'App loaded');
  }, []);

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          URL Shortener
        </Typography>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
          <Tab label="Shorten URLs" />
          <Tab label="Statistics" />
        </Tabs>
        {tab === 0 && <ShortenerPage />}
        {tab === 1 && <StatsPage />}
      </Box>
    </Container>
  );
}

export default App;
