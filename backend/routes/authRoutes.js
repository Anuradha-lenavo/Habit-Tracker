const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Your User model
const router = express.Router();
const nodemailer = require('nodemailer'); 

const otpMap = new Map(); 
// Register endpoint
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, 'yourefde70f51cef4b21eb4ded0230aa5f4099d4cb2e403e413341a920375032309129b62e86a7b7c5391692bf27cf58c2e39af1e44be11682ac42eab673a525d569', { expiresIn: '1h' });
    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, 'yourefde70f51cef4b21eb4ded0230aa5f4099d4cb2e403e413341a920375032309129b62e86a7b7c5391692bf27cf58c2e39af1e44be11682ac42eab673a525d569', { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Temporarily store OTPs (use a DB for production)

// Send OTP endpoint
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  try {
    console.log('Checking if user exists...');
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
    console.log('Generated OTP:', otp);

    otpMap.set(email, otp);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'Youremail@gmail.com',
        pass: 'your app password', // Use app password here
      },
    });

    console.log('Sending email...');
    await transporter.sendMail({
      from: 'rajeshwarim20004@gmail.com',
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}`,
    });

    console.log('Email sent successfully');
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error in /send-otp:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});


router.post('/validate-otp', (req, res) => {
  const { email, otp } = req.body;

  if (otpMap.get(email) == otp) {
    otpMap.delete(email); // Remove OTP after successful validation
    res.json({ success: true });
  } else {
    res.status(400).json({ message: 'Invalid OTP' });
  }
});


module.exports = router;
