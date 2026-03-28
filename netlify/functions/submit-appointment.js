const { google } = require('googleapis');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    try {
        const data = JSON.parse(event.body);
        
        const required = ['firstName', 'lastName', 'email', 'phone', 'department', 'date', 'time'];
        for (const field of required) {
            if (!data[field] || data[field].trim() === '') {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ success: false, error: `Missing field: ${field}` })
                };
            }
        }

        const id = `apt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        const appointment = {
            id: id,
            createdAt: new Date().toISOString(),
            status: 'pending',
            patient: {
                firstName: data.firstName.trim(),
                lastName: data.lastName.trim(),
                email: data.email.trim().toLowerCase(),
                phone: data.phone.trim(),
            },
            appointment: {
                department: data.department,
                preferredDate: data.date,
                preferredTime: data.time,
                notes: data.notes?.trim() || ''
            }
        };

        const oauth2Client = new google.auth.OAuth2(
            process.env.GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET,
            'https://superb-kheer-62a8ff.netlify.app/.netlify/functions/oauth-callback'
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.GMAIL_REFRESH_TOKEN
        });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        
        const adminEmail = process.env.ADMIN_EMAIL || 'st.josephine.appointments@gmail.com';
        
        const emailHtml = `
            <html>
            <body>
                <h2>📋 NEW APPOINTMENT</h2>
                <p><strong>ID:</strong> ${id}</p>
                <p><strong>Patient:</strong> ${appointment.patient.firstName} ${appointment.patient.lastName}</p>
                <p><strong>Email:</strong> ${appointment.patient.email}</p>
                <p><strong>Phone:</strong> ${appointment.patient.phone}</p>
                <p><strong>Department:</strong> ${appointment.appointment.department}</p>
                <p><strong>Date:</strong> ${appointment.appointment.preferredDate}</p>
                <p><strong>Time:</strong> ${appointment.appointment.preferredTime}</p>
                ${appointment.appointment.notes ? `<p><strong>Notes:</strong> ${appointment.appointment.notes}</p>` : ''}
                <hr>
                <p><a href="https://superb-kheer-62a8ff.netlify.app/admin.html">Open Admin Dashboard</a></p>
            </body>
            </html>
        `;
        
        const emailMessage = [
            `To: ${adminEmail}`,
            `Subject: New Appointment: ${appointment.patient.firstName} ${appointment.patient.lastName}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            '',
            emailHtml
        ].join('\n');
        
        const encodedMessage = Buffer.from(emailMessage)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        
        await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw: encodedMessage }
        });

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                message: 'Appointment submitted successfully!',
                id: id
            })
        };

    } catch (error) {
        console.error('Submit error:', error);
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
