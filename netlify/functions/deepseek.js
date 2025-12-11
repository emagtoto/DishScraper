const axios = require('axios');

exports.handler = async (event, context) => {
  // Set function timeout context
  context.callbackWaitsForEmptyEventLoop = false;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    
    if (!DEEPSEEK_API_KEY) {
      console.error('DEEPSEEK_API_KEY not found');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'API key not configured',
          details: 'Please add DEEPSEEK_API_KEY in Netlify environment variables'
        })
      };
    }

    let requestData;
    try {
      requestData = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    console.log('Calling DeepSeek API...');
    
    // Reduce timeout to stay under Netlify's 26 second limit
    const response = await axios.post(
      'https://api.deepseek.com/chat/completions',
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000  // 20 seconds max for API call
      }
    );

    console.log('DeepSeek API success');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response.data)
    };

  } catch (error) {
    console.error('Function error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // Handle timeout specifically
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        statusCode: 504,
        headers,
        body: JSON.stringify({ 
          error: 'Request timeout',
          details: 'AI request took too long. Try simplifying your request.'
        })
      };
    }
    
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data || { 
      error: error.message,
      details: 'Check Netlify function logs'
    };

    return {
      statusCode,
      headers,
      body: JSON.stringify(errorMessage)
    };
  }
};