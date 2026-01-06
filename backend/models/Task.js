const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'completed'], 
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', TaskSchema);