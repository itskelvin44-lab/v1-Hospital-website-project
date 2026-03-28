const fetch = require('node-fetch');

exports.handler = async (event) => {
    const code = event.queryStringParameters?.code;
    
    if (!code) {
        return {
            statusCode: 400,
            body: "No authorization code provided"
        };
    }
    
    const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
    const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
    const REDIRECT_URI = "https://superb-kheer-62a8ff.netlify.app/.netlify/functions/oauth-callback";
    
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
            <head><title>Refresh Token</title></head>
            <body style="font-family: monospace; padding: 20px;">
                <h1>✅ Authorization Successful!</h1>
                <pre>${JSON.stringify(tokens, null, 2)}</pre>
                <p><strong>Refresh Token:</strong> ${tokens.refresh_token || 'NO REFRESH TOKEN'}</p>
                <p>Add this to Netlify environment variables as GMAIL_REFRESH_TOKEN</p>
            </body>
            </html>
        `
    };
};
