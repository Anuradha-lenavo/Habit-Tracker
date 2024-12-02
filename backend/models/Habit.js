const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    trim: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  reminder: {
    type: Boolean,
    default: false,
  },
  reminderTime: {
    type: String,
    default: '', // Optional
  },
  category: {
    type: String,
    required: true,
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly'], // Ensure valid frequency values
    default: 'daily',
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  progress: [
    {
      date: { type: Date, required: true },
      status: { type: String, enum: ['completed', 'skipped'], required: true },
    },
  ],

  // New Rewards Field
  rewards: {
    points: { type: Number, default: 0 }, // Total points earned for the habi// List of badge names earned
    message: { type: String, default:'' },
  },
});

module.exports = mongoose.model('Habit', habitSchema);
