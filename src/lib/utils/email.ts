import nodemailer from 'nodemailer'

interface SendEmailPayload {
    to: string
    subject: string
    html: string
}

// 1. Create a reusable transporter configuration
// Change the host and port based on your provider (see table below)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your provider's App Password (NOT your login password)
    },
    // TLS settings needed for certain modern SMTP providers like Outlook
    // tls: {
    //   ciphers: 'SSLv3',
    //   rejectUnauthorized: false
    // }
})

export async function sendEmail({ to, subject, html }: SendEmailPayload) {
    // 2. Development Simulation Check
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('\n===== DEVELOPMENT EMAIL SIMULATION =====')
        console.log(`To: ${to}`)
        console.log(`Subject: ${subject}`)
        console.log(
            'Check the console logs to retrieve your mock system connection validation string.',
        )
        console.log('========================================\n')
        return { success: true, mock: true }
    }

    try {
        // 3. Send the email
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER, // The sender address
            to: to, // List of receivers
            subject: subject, // Subject line
            html: html, // HTML body content
        })

        return { success: true, id: info.messageId }
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : String(error)
        console.error('SMTP Mailing engine exception:', errorMessage)
        throw new Error(`Email delivery failed: ${errorMessage}`)
    }
}
