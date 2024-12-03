const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'rajeshwarim20004@gmail.com',
    pass: 'vqaw uunk qgcv ozcb', // Replace with your app-specific password
  },
});

const sendReminderEmail = (email, habitName, userName) => {
  const mailOptions = {
    from: 'rajeshwarim20004@gmail.com',
    to: email,
    subject: `Reminder for your habit: ${habitName}`,
    text: `Hi ${userName},\n\nThis is a reminder for your habit: ${habitName}.\n\nKeep up the good work!\n\nBest regards,\nTrackify`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

module.exports = { sendReminderEmail };
