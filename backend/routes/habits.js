const express = require('express');
const Habit = require('../models/Habit');
const User = require('../models/User'); // Ensure User model is imported
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');

// Fetch all habits for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.userId }).populate('progress'); // Populate progress for each habit
    res.status(200).json(habits);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching habits' });
  }
});

// Fetch the user profile (single /profile route)
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId); // Make sure you're using req.userId from the middleware
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ username: user.username }); // Send back the username
  } catch (error) {
    res.status(500).json({ message: 'Failed to get user profile' });
  }
});

// Add a new habit
router.post('/', authMiddleware, async (req, res) => {
  const { name, description, startDate, reminder, category, frequency, reminderTime } = req.body;

  try {
    const newHabit = new Habit({
      name,
      description,
      startDate,
      reminder,
      reminderTime,
      category,
      frequency,
      user: req.userId, // Associate with the logged-in user
    });

    const savedHabit = await newHabit.save();
    res.status(201).json(savedHabit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating habit' });
  }
});

// Update the completion status of a habit
router.put('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const habitId = req.params.id;
    const habit = await Habit.findById(habitId);

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Toggle the completedToday status
    habit.completedToday = !habit.completedToday;
    await habit.save();

    // Return the updated habit with the new status
    res.status(200).json(habit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a habit
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const habit = await Habit.findOneAndDelete({ _id: id, user: req.userId }); // Ensure habit belongs to the logged-in user

    if (!habit) return res.status(404).json({ message: 'Habit not found' });

    res.status(200).json({ message: 'Habit deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting habit' });
  }
});

router.put('/:id/progress', authMiddleware, async (req, res) => {
  const { id } = req.params; // Habit ID
  const { date, status } = req.body; // Date and status (completed/skipped) from the frontend

  try {
    // Fetch the habit based on the given habit ID
    const habit = await Habit.findById(id);
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Check if progress for the given date already exists
    const existingProgress = habit.progress.find(
      (entry) => entry.date.toISOString().split('T')[0] === date // Compare only the date part
    );

    if (existingProgress) {
      // Update the existing progress status (it could be 'completed' or 'skipped')
      existingProgress.status = status;
    } else {
      // Add a new progress entry with the given status
      habit.progress.push({ date: new Date(date), status });
    }

    // Update rewards based on progress
    let completedDays = habit.progress.filter(entry => entry.status === 'completed').length;

    if (status === 'completed') {
      habit.rewards.points = completedDays * 2.5; // Award 2.5 points for each completed day
    } else if (status === 'skipped') {
      habit.rewards.points = Math.max(0, (completedDays - 1) * 2.5); // Deduct points if skipped
    }

    await habit.save(); // Save the habit with the updated progress and rewards

    // Send the updated habit data back to the client
    res.status(200).json(habit);
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ message: 'Error updating progress' });
  }
});

// Update a habit (name, description, startDate, reminder)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const habitId = req.params.id;
    const { name, description, startDate, reminder, reminderTime, category, frequency } = req.body;

    // Find and update the habit
    const updatedHabit = await Habit.findByIdAndUpdate(
      habitId,
      { name, description, startDate, reminder, reminderTime, category, frequency },
      { new: true } // Return the updated habit
    );

    if (!updatedHabit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    res.status(200).json(updatedHabit); // Return the updated habit
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating habit' });
  }
});
// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'Gmail', // or another email service
  auth: {
    user: 'your-email@gmail.com', // Replace with your email
    pass: 'your-email-password', // Replace with your password or app-specific password
  },
});

// Schedule a reminder email
const scheduleReminder = (habit, user,) => {
  const { reminderTime, name } = habit;
  const [hours, minutes] = reminderTime.split(':');

  // Schedule the job
  schedule.scheduleJob({ hour: parseInt(hours), minute: parseInt(minutes) }, async () => {
    const mailOptions = {
      from: 'rajeshwarim20004@gmail.com',
      to: user.email, // Replace with the user's email
      subject: `Reminder: ${name}`,
      text: `Hi ${user.name},\n\nThis is a reminder for your habit: ${name}.\n\nKeep up the good work!\n\nBest regards,\nTrackify`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Reminder email sent!');
    } catch (error) {
      console.error('Error sending email:', error);
    }
  });
};

// Example usage: Schedule for all habits with reminders
const habits = [
  { name: 'Morning Yoga', reminderTime: '07:30' },
  { name: 'Read a book', reminderTime: '20:00' },
];

const user = { name: 'John Doe', email: 'johndoe@example.com' };

habits.forEach((habit) => {
  if (habit.reminderTime) {
    scheduleReminder(habit, user);
  }
});
module.exports = router;
