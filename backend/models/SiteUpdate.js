const mongoose = require('mongoose');

const SiteUpdateSchema = new mongoose.Schema({
  sliderValue: { type: Number, required: true },
  imageUrl: { type: String },
  source: { type: String, default: 'site_engineer' },
  uploadId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SiteUpdate', SiteUpdateSchema);
