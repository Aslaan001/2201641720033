const mongoose = require('mongoose');

const ClickSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  referrer: String,
  geo: String
});

const ShortUrlSchema = new mongoose.Schema({
  url: { type: String, required: true },
  shortcode: { type: String, required: true, unique: true },
  expiry: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  clicks: { type: [ClickSchema], default: [] }
});

module.exports = mongoose.model('ShortUrl', ShortUrlSchema);
