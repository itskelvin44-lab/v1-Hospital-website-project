const fetch = require('node-fetch');

exports.handler = async (event) => {
    const code = event.queryStringParameters?.code;
    if (!code) {
        return { statusCode: 400, body: "No authorization code provided" };
    }
    
    const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
    const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
    const REDIRECT_URI = "https://superb-daifuku-d7ba2a.netlify.app/.netlify/functions/oauth-callback";
    
    if (!CLIENT_ID || !CLIENT_SECRET) {
        return { statusCode: 500, body: "OAuth credentials not configured in environment variables" };
    }
    
    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            code: code,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            grant_type: "authorization_code"
        })
    });
    
    const tokens = await response.json();
    
    return {
        statusCode: 200,
        headers: { "Content-Type": "text/html" },
        body: `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Refresh Token</title>
                <style>
                    body { font-family: monospace; background: #0B1F3A; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; }
                    .card { background: white; border-radius: 20px; padding: 2rem; max-width: 600px; text-align: center; }
                    button { background: #1155A4; color: white; border: none; padding: 10px 20px; border-radius: 50px; cursor: pointer; margin-top: 1rem; }
                    pre { background: #f0f0f0; padding: 1rem; border-radius: 8px; overflow-x: auto; text-align: left; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>✅ Authorization Successful!</h1>
                    <p><strong>Refresh Token:</strong></p>
                    <pre>${tokens.refresh_token || 'NO REFRESH TOKEN'}</pre>
                    <p>Copy this token and add to Netlify as GMAIL_REFRESH_TOKEN</p>
                    <button onclick="navigator.clipboard.writeText('${tokens.refresh_token || ''}')">📋 Copy Token</button>
                    <p style="margin-top: 1rem; font-size: 12px;">Then redeploy your site and test the appointment form.</p>
                </div>
            </body>
            </html>
        `
    };
};