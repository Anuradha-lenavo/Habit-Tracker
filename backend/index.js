const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const habitRoutes = require('./routes/habits');

const app = express();

const cors = require('cors');
const cronJobs = require('./cronJobs');

app.use(express.json());
app.use(cors());
// Connect to MongoDB
mongoose.connect('MONGO MONGODB URI', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error(err));

// Use routes
app.use('/api/habits', habitRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
cronJobs(); 
