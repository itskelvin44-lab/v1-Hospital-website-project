const { google } = require('googleapis');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    try {
        const { action, patientEmail, patientName, department, date, time, notes } = JSON.parse(event.body);
        
        const oauth2Client = new google.auth.OAuth2(
            process.env.GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET,
            'https://superb-kheer-62a8ff.netlify.app/.netlify/functions/oauth-callback'
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.GMAIL_REFRESH_TOKEN
        });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        
        let subject, emailBody;
        
        if (action === 'accept') {
            subject = `✅ Appointment Confirmed - ${patientName}`;
            emailBody = `
                <html>
                <body style="font-family: Arial, sans-serif;">
                    <h2>Appointment Confirmed</h2>
                    <p>Dear ${patientName},</p>
                    <p>Your appointment has been confirmed.</p>
                    <p><strong>Department:</strong> ${department}</p>
                    <p><strong>Date:</strong> ${date}</p>
                    <p><strong>Time:</strong> ${time}</p>
                    <p>Please arrive 15 minutes early.</p>
                    <p>Thank you,<br>St. Josephine Mara Hospital</p>
                </body>
                </html>
            `;
        } else {
            subject = `🔄 Appointment Rescheduled - ${patientName}`;
            emailBody = `
                <html>
                <body style="font-family: Arial, sans-serif;">
                    <h2>Appointment Rescheduled</h2>
                    <p>Dear ${patientName},</p>
                    <p>Your appointment has been rescheduled.</p>
                    <p><strong>Department:</strong> ${department}</p>
                    <p><strong>New Date:</strong> ${date}</p>
                    <p><strong>New Time:</strong> ${time}</p>
                    <p>Thank you,<br>St. Josephine Mara Hospital</p>
                </body>
                </html>
            `;
        }
        
        const emailMessage = [
            `To: ${patientEmail}`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            '',
            emailBody
        ].join('\n');
        
        const encodedMessage = Buffer.from(emailMessage)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        
        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage
            }
        });
        
        console.log(`✅ ${action} email sent to ${patientEmail}`);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                message: `${action === 'accept' ? 'Confirmed' : 'Rescheduled'} successfully`,
                emailSent: true
            })
        };

    } catch (error) {
        console.error('Process error:', error);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};
