// This is a serverless function for Netlify
// It handles authentication for the admin panel

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Parse the request body
    const { username, password } = JSON.parse(event.body);

    // Check credentials (in a real app, these would be stored securely)
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Generate a simple token (in a real app, use JWT)
      const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          token,
          message: 'Authentication successful' 
        }),
      };
    } else {
      return {
        statusCode: 401,
        body: JSON.stringify({ 
          success: false, 
          error: 'Invalid credentials' 
        }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false, 
        error: 'Server error' 
      }),
    };
  }
};