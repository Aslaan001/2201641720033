const express = require('express');
const router = express.Router();
const ShortUrl = require('../models/ShortUrl');
const Log = require('logging-middleware');
const { nanoid } = require('nanoid');

// Helper: Validate URL
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// GET /shorturls/all - Get all short URLs and their stats
router.get('/all', async (req, res) => {
  try {
    const all = await ShortUrl.find();
    const base = req.protocol + '://' + req.get('host');
    const stats = all.map(s => ({
      url: s.url,
      shortcode: s.shortcode,
      shortLink: `${base}/${s.shortcode}`,
      createdAt: s.createdAt,
      expiry: s.expiry,
      clickCount: (s.clicks || []).length,
      clicks: (s.clicks || []).map(c => ({ timestamp: c.timestamp, referrer: c.referrer, geo: c.geo }))
    }));
    await Log('backend', 'info', 'handler', 'All stats retrieved');
    res.json(stats);
  } catch (err) {
    await Log('backend', 'error', 'handler', `Stats fetch error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch stats', details: err.message });
  }
});

// POST /shorturls - Create a short URL
router.post('/', async (req, res) => {
  const { url, validity, shortcode } = req.body;
  if (!url || !isValidUrl(url)) {
    await Log('backend', 'error', 'handler', 'Invalid URL format');
    return res.status(400).json({ error: 'Invalid URL format' });
  }
  let code = shortcode;
  if (code) {
    if (!/^[a-zA-Z0-9_-]{4,}$/.test(code)) {
      await Log('backend', 'error', 'handler', 'Invalid shortcode format');
      return res.status(400).json({ error: 'Invalid shortcode format' });
    }
    const exists = await ShortUrl.findOne({ shortcode: code });
    if (exists) {
      await Log('backend', 'warn', 'handler', 'Shortcode already exists');
      return res.status(409).json({ error: 'Shortcode already exists' });
    }
  } else {
    // Generate unique shortcode
    do {
      code = nanoid(6);
    } while (await ShortUrl.findOne({ shortcode: code }));
  }
  const minutes = Number.isInteger(validity) ? validity : 30;
  const expiry = new Date(Date.now() + minutes * 60000);
  const shortUrl = new ShortUrl({ url, shortcode: code, expiry });
  await shortUrl.save();
  await Log('backend', 'info', 'handler', `Short URL created: ${code}`);
  res.status(201).json({ shortLink: `${req.protocol}://${req.get('host')}/${code}`, expiry: expiry.toISOString() });
});

// GET /shorturls/:shortcode - Get stats for a short URL
router.get('/:shortcode', async (req, res) => {
  const { shortcode } = req.params;
  const shortUrl = await ShortUrl.findOne({ shortcode });
  if (!shortUrl) {
    await Log('backend', 'warn', 'handler', 'Shortcode not found');
    return res.status(404).json({ error: 'Shortcode not found' });
  }
  const stats = {
    url: shortUrl.url,
    shortcode: shortUrl.shortcode,
    createdAt: shortUrl.createdAt,
    expiry: shortUrl.expiry,
    clickCount: shortUrl.clicks.length,
    clicks: shortUrl.clicks.map(c => ({ timestamp: c.timestamp, referrer: c.referrer, geo: c.geo }))
  };
  await Log('backend', 'info', 'handler', `Stats retrieved for shortcode: ${shortcode}`);
  res.json(stats);
});

module.exports = router;
