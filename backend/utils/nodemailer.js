// utils/nodemailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or any other email service you want to use
  auth: {
    user:  'YOUR EMAIL',
        pass: 'YOUR EMAIL APP PASSWORD', // your email password or app password
  },
});

const sendReminderEmail = (email, habitName, reminderTime) => {
  const mailOptions = {
    from:  'YOUR EMAIL',
    to: email,
    subject: `Reminder for your habit: ${habitName}`,
    text: `This is a reminder for your habit "${habitName}" scheduled at ${reminderTime}. Don't forget to complete it!`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

module.exports = { sendReminderEmail };
