import nodemailer from 'nodemailer';

const transporter = await nodemailer.createTransport({
    host: '127.0.0.1',
    port: 1025,
    secure: false,
    tls: {
        rejectUnauthorized: false
    }
});

const mailOptions = {
    from: 'sender@example.com',
    to: ['recipient@example.com'],
    subject: 'Test Email with Attachments',
    text: 'This is a plain text email with attachments.',
    html: '<h1>Hello!</h1><p>This is an <strong>HTML</strong> email with attachments.</p>',
    attachments: [
        {
            filename: 'text.txt',
            content: 'Hello, World!',
            contentType: 'text/plain'
        },
        {
            filename: 'data.json',
            content: JSON.stringify({ message: 'Hello from JSON!' }, null, 2),
            contentType: 'application/json'
        }
    ]
};

const info = await transporter.sendMail(mailOptions);

console.log('Email sent:', info.messageId);