const mongoose = require('mongoose');

const warnSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  groupId: String,
  count: { type: Number, default: 0 }
});

module.exports = mongoose.models.Warn || mongoose.model('Warn', warnSchema);

