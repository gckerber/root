// functions/village-api/contact/index.js
// Handles contact form submissions and sends email via Azure Communication Services
// Uses Managed Identity to retrieve secrets from Key Vault — no hardcoded credentials

const { EmailClient } = require('@azure/communication-email')
const { SecretClient } = require('@azure/keyvault-secrets')
const { DefaultAzureCredential } = require('@azure/identity')

// Rate limit store (in-memory; resets on cold start — acceptable for low-traffic village site)
const rateLimitStore = new Map()
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX = 3 // max 3 submissions per IP per window

function getRateLimit(ip) {
  const now = Date.now()
  const record = rateLimitStore.get(ip)
  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now })
    return false // not rate limited
  }
  record.count += 1
  return record.count > RATE_LIMIT_MAX
}

function validateInput({ name, email, subject, message }) {
  if (!name || name.trim().length < 2) return 'Name is required'
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Valid email is required'
  if (!subject) return 'Subject is required'
  if (!message || message.trim().length < 10) return 'Message must be at least 10 characters'
  if (message.length > 5000) return 'Message is too long (max 5000 characters)'
  return null
}

function sanitize(str) {
  if (!str) return ''
  return String(str).replace(/[<>]/g, '').trim().slice(0, 1000)
}

module.exports = async function (context, req) {
  context.log('Contact form submission received')

  // CORS preflight
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' } }
    return
  }

  if (req.method !== 'POST') {
    context.res = { status: 405, body: { message: 'Method not allowed' } }
    return
  }

  // Rate limiting
  const ip = req.headers['x-forwarded-for'] || req.headers['client-ip'] || 'unknown'
  if (getRateLimit(ip)) {
    context.res = { status: 429, body: { message: 'Too many submissions. Please wait 15 minutes.' } }
    return
  }

  const { name, email, phone, subject, message } = req.body || {}

  // Validate
  const validationError = validateInput({ name, email, subject, message })
  if (validationError) {
    context.res = { status: 400, body: { message: validationError } }
    return
  }

  try {
    // Retrieve email connection string from Key Vault using Managed Identity
    const credential = new DefaultAzureCredential()
    const kvClient = new SecretClient(process.env.KEY_VAULT_URI, credential)
    const commConnStrSecret = await kvClient.getSecret('communication-connection-string')
    const connectionString = commConnStrSecret.value

    const emailClient = new EmailClient(connectionString)
    const contactEmail = process.env.CONTACT_EMAIL || 'info@saintlouisvilleohio.gov'

    const emailMessage = {
      senderAddress: `donotreply@saintlouisvilleohio.gov`,
      recipients: { to: [{ address: contactEmail }] },
      content: {
        subject: `Village Contact Form: ${sanitize(subject)} — from ${sanitize(name)}`,
        plainText: [
          `New contact form submission from the Village of Saint Louisville website`,
          ``,
          `Name: ${sanitize(name)}`,
          `Email: ${sanitize(email)}`,
          `Phone: ${sanitize(phone) || 'Not provided'}`,
          `Subject: ${sanitize(subject)}`,
          ``,
          `Message:`,
          sanitize(message),
          ``,
          `---`,
          `Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}`,
          `IP: ${ip}`,
        ].join('\n'),
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1e3a8a; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0;">New Contact Form Submission</h2>
              <p style="margin: 4px 0 0; opacity: 0.8; font-size: 14px;">Village of Saint Louisville Website</p>
            </div>
            <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 120px;">Name</td><td style="padding: 8px 0; font-weight: bold;">${sanitize(name)}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Email</td><td style="padding: 8px 0;"><a href="mailto:${sanitize(email)}">${sanitize(email)}</a></td></tr>
                <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Phone</td><td style="padding: 8px 0;">${sanitize(phone) || 'Not provided'}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Subject</td><td style="padding: 8px 0;">${sanitize(subject)}</td></tr>
              </table>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;">
              <h4 style="margin: 0 0 8px; color: #374151;">Message</h4>
              <p style="background: white; padding: 16px; border-radius: 6px; border: 1px solid #e2e8f0; white-space: pre-wrap; font-size: 14px; color: #374151;">${sanitize(message)}</p>
            </div>
            <div style="padding: 12px 24px; background: #f1f5f9; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; font-size: 12px; color: #94a3b8;">
              Submitted ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET
            </div>
          </div>`,
      },
    }

    const poller = await emailClient.beginSend(emailMessage)
    await poller.pollUntilDone()

    context.log('Contact email sent successfully')
    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: { success: true, message: 'Your message has been sent.' },
    }
  } catch (err) {
    context.log.error('Contact form error:', err.message)
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: { message: 'Failed to send message. Please try again or call Village Hall directly.' },
    }
  }
}
