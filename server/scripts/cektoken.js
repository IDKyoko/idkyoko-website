require('dotenv').config();
const jwt = require('jsonwebtoken');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NDcwYjgxNjczMTRmNGM5MmRjZTAyOCIsInVzZXJuYW1lIjoiYWRtaW4iLCJpYXQiOjE3NDk0OTI5MjUsImV4cCI6MTc0OTQ5MjkyOH0.COmZc5Qpp1BhKEfzmlP9WwkrD2c90ITdH6Lmpyw5K64';

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('Token valid:', decoded);
} catch (err) {
  console.error('Token error:', err.message);
}
