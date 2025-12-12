const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'DeepSeek Proxy Server is running' });
});

// DeepSeek API Proxy
app.post('/api/deepseek', async (req, res) => {
  try {
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

    if (!DEEPSEEK_API_KEY) {
      console.error('DEEPSEEK_API_KEY not found in environment');
      return res.status(500).json({
        error: 'API key not configured',
        details: 'DEEPSEEK_API_KEY environment variable is missing'
      });
    }

    console.log('Proxying request to DeepSeek API...');

    const response = await axios.post(
      'https://api.deepseek.com/chat/completions',
      req.body,
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 2 minutes
      }
    );

    console.log('DeepSeek API responded successfully');
    res.json(response.data);

  } catch (error) {
    console.error('Proxy error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data || {
      error: error.message,
      details: 'DeepSeek API request failed'
    };

    res.status(statusCode).json(errorMessage);
  }
});

app.listen(PORT, () => {
  console.log(`✅ Proxy server running on port ${PORT}`);
});