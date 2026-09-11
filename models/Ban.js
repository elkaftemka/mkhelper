const mongoose = require('mongoose');

const banSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: String,
  reason: String,
  adminId: String,
  groupId: String,
  date: { type: Date, default: Date.now }
});

// Mencegah error kompilasi ulang di lingkungan Serverless Vercel
module.exports = mongoose.models.Ban || mongoose.model('Ban', banSchema);

