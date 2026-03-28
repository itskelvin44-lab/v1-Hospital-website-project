const { google } = require('googleapis');

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET,
            'https://superb-daifuku-d7ba2a.netlify.app/.netlify/functions/oauth-callback'
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.GMAIL_REFRESH_TOKEN
        });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        
        const response = await gmail.users.messages.list({
            userId: 'me',
            q: 'subject:"New Appointment:"',
            maxResults: 50
        });

        const messages = response.data.messages || [];
        const appointments = [];

        for (const message of messages) {
            const msg = await gmail.users.messages.get({
                userId: 'me',
                id: message.id,
                format: 'full'
            });

            const subject = msg.data.payload.headers.find(h => h.name === 'Subject')?.value || '';
            const nameMatch = subject.match(/New Appointment: (.+)$/);
            const fullName = nameMatch ? nameMatch[1] : 'Unknown';
            const nameParts = fullName.split(' ');
            const firstName = nameParts[0] || 'Unknown';
            const lastName = nameParts.slice(1).join(' ') || '';

            appointments.push({
                id: message.id,
                createdAt: new Date(parseInt(msg.data.internalDate)).toISOString(),
                status: 'pending',
                patient: {
                    firstName: firstName,
                    lastName: lastName,
                    email: 'Check email',
                    phone: 'Check email'
                },
                appointment: {
                    department: 'Check email',
                    preferredDate: 'Check email',
                    preferredTime: 'Check email',
                    notes: ''
                }
            });
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                appointments: appointments,
                count: appointments.length
            })
        };

    } catch (error) {
        console.error('Get appointments error:', error);
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
