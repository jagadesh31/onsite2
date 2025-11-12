const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const userRouter = require('./routes/user.js');
const app = express();

const CLIENT_BASE_URL = process.env.CLIENT_BASE_URL || 'https://jauth.jagadesh31.tech';

// Use simpler CORS configuration first (like your working version)
app.use(cors({
  origin: CLIENT_BASE_URL,
  credentials: true
}));

app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Jauth Backend is running!',
    server: 'jauth-server.jagadesh31.tech'
  });
});

app.use('/user', userRouter);

const port = process.env.PORT || 5001;

console.log(process.env.MONGO_URL);

mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('MongoDB connected successfully');
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.log('Error connecting to MongoDB: ' + err);
  });