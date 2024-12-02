// cronJobs.js
const cron = require('node-cron');
const { sendReminderEmail } = require('./utils/nodemailer');
const Habit = require('./models/Habit');
const User = require('./models/User');
const moment = require('moment'); // or date-fns if you prefer

const cronJobs = () => {
  // Cron job to send reminders every minute
  cron.schedule('* * * * *', async () => {
    try {
      const habitsWithReminders = await Habit.find({ reminder: true });

      const currentTime = moment().format('HH:mm'); // Current time in 24-hour format

      for (const habit of habitsWithReminders) {
        const habitReminderTime = habit.reminderTime;

        if (habitReminderTime === currentTime) {
          const user = await User.findById(habit.user); // Get the user for the habit
          if (user && user.email) {
            // Send reminder email to the user
            sendReminderEmail(user.email, habit.name, habit.reminderTime);
          }
        }
      }
    } catch (error) {
      console.error('Error checking habits for reminders:', error);
    }
  });
};

// Export the cronJobs function
module.exports = cronJobs;
