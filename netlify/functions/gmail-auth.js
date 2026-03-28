const fetch = require('node-fetch');

exports.handler = async (event) => {
    // Get the authorization code from URL
    const code = event.queryStringParameters?.code;
    
    if (!code) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "No authorization code provided" })
        };
    }

    const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
    const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
    const REDIRECT_URI = "https://superb-daifuku-d7ba2a.netlify.app/.netlify/functions/gmail-auth";

    if (!CLIENT_ID || !CLIENT_SECRET) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "OAuth credentials not configured" })
        };
    }

    try {
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

        if (tokens.error) {
            return {
                statusCode: 400,
                body: `
                    <!DOCTYPE html>
                    <html>
                    <head><title>Error</title></head>
                    <body style="font-family: monospace; background: #0B1F3A; display: flex; justify-content: center; align-items: center; min-height: 100vh;">
                        <div style="background: white; border-radius: 20px; padding: 2rem; text-align: center;">
                            <h1 style="color: red;">❌ Error</h1>
                            <pre>${JSON.stringify(tokens.error, null, 2)}</pre>
                        </div>
                    </body>
                    </html>
                `
            };
        }

        // Display the refresh token
        return {
            statusCode: 200,
            headers: { "Content-Type": "text/html" },
            body: `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Gmail Auth - Success!</title>
                    <style>
                        body { background: #0B1F3A; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: monospace; margin: 0; padding: 20px; }
                        .card { background: white; border-radius: 20px; padding: 2rem; max-width: 700px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
                        h1 { color: #0B1F3A; margin-bottom: 1rem; }
                        .token-box { background: #f0f0f0; border-radius: 8px; padding: 1rem; margin: 1rem 0; overflow-x: auto; text-align: left; font-family: monospace; font-size: 12px; word-break: break-all; }
                        button { background: #1155A4; color: white; border: none; padding: 12px 24px; border-radius: 50px; cursor: pointer; font-size: 16px; margin-top: 1rem; }
                        button:hover { background: #0e488a; }
                        .success { color: #2e7d32; font-size: 14px; margin-top: 1rem; }
                        hr { margin: 1.5rem 0; }
                        .warning { background: #fff3e0; padding: 1rem; border-radius: 8px; text-align: left; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h1>✅ Authorization Successful!</h1>
                        <p>Your Gmail account is now connected to St. Josephine Mara Hospital.</p>
                        
                        <hr>
                        
                        <h3>📋 Refresh Token</h3>
                        <div class="token-box" id="refreshToken">${tokens.refresh_token || '⚠️ NO REFRESH TOKEN RECEIVED'}</div>
                        
                        ${!tokens.refresh_token ? `
                        <div class="warning">
                            <strong>⚠️ No refresh token received!</strong><br>
                            This usually means the account was already authorized. Try:
                            <ol style="margin-top: 8px;">
                                <li>Revoke access at <a href="https://myaccount.google.com/permissions" target="_blank">Google Account Permissions</a></li>
                                <li>Go back and authorize again</li>
                            </ol>
                        </div>
                        ` : `
                        <button onclick="copyToken()">📋 Copy Refresh Token</button>
                        <div class="success" id="copyMsg"></div>
                        
                        <hr>
                        
                        <h3>📌 Next Steps</h3>
                        <ol style="text-align: left;">
                            <li>Copy the refresh token above</li>
                            <li>Go to Netlify Dashboard → Site Settings → Environment Variables</li>
                            <li>Add variable: <code>GMAIL_REFRESH_TOKEN</code> with the copied value</li>
                            <li>Deploy your site again</li>
                            <li>Test the appointment form!</li>
                        </ol>
                        `}
                        
                        <script>
                            function copyToken() {
                                const token = document.getElementById('refreshToken').innerText;
                                navigator.clipboard.writeText(token).then(() => {
                                    const msg = document.getElementById('copyMsg');
                                    msg.innerText = '✅ Copied to clipboard!';
                                    setTimeout(() => msg.innerText = '', 3000);
                                });
                            }
                        </script>
                    </div>
                </body>
                </html>
            `
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: `
                <!DOCTYPE html>
                <html>
                <head><title>Error</title></head>
                <body style="font-family: monospace; background: #0B1F3A; display: flex; justify-content: center; align-items: center; min-height: 100vh;">
                    <div style="background: white; border-radius: 20px; padding: 2rem; text-align: center;">
                        <h1 style="color: red;">❌ Server Error</h1>
                        <pre>${error.message}</pre>
                    </div>
                </body>
                </html>
            `
        };
    }
};