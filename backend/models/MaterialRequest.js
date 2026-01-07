const mongoose = require('mongoose');

/**
 * MaterialRequest Schema
 * Stores requisitions sent from the site engineer for admin approval.
 */
const MaterialRequestSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  qty: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('MaterialRequest', MaterialRequestSchema);