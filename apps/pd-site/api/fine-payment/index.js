// apps/pd-site/api/fine-payment/index.js
//
// IMPORTANT: This function handles fine payment confirmation.
// In production, integrate a real payment processor (Stripe, PaySimple, etc.)
// using client-side tokenization — never process raw card data server-side.
// Receive a payment token from the frontend Stripe.js/Elements SDK,
// then call the processor API here to confirm the charge.
//
const { CosmosClient } = require('@azure/cosmos')
const { EmailClient } = require('@azure/communication-email')
const { v4: uuidv4 } = require('uuid')

let _cosmosClient = null
let _emailClient = null

function getClients() {
  if (!_cosmosClient) _cosmosClient = new CosmosClient(process.env.COSMOS_CONNECTION_STRING)
  if (!_emailClient && process.env.COMMUNICATION_CONNECTION_STRING) {
    _emailClient = new EmailClient(process.env.COMMUNICATION_CONNECTION_STRING)
  }
}

function generateConfirmationNumber() {
  const now = new Date()
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const rand = Math.random().toString(36).toUpperCase().slice(2, 7)
  return `SLP-${ymd}-${rand}`
}

async function sendReceiptEmail(emailClient, { toAddress, citationNumber, amount, confirmationNumber, violationType }) {
  if (!emailClient || !toAddress) return
  const formattedAmount = parseFloat(amount).toFixed(2)
  const formattedDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })
  const message = {
    senderAddress: 'donotreply@saintlouisvilleohio.gov',
    recipients: { to: [{ address: toAddress }] },
    content: {
      subject: `Fine Payment Confirmation — ${confirmationNumber}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;">
          <div style="background:#0f172a;color:white;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
            <h1 style="margin:0;font-size:22px;">⚖️ Fine Payment Confirmed</h1>
            <p style="margin:8px 0 0;opacity:0.7;font-size:14px;">Saint Louisville Police Department</p>
          </div>
          <div style="background:white;padding:32px;border:1px solid #e2e8f0;border-top:none;">
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;text-align:center;margin-bottom:24px;">
              <p style="margin:0;font-size:14px;color:#16a34a;font-weight:bold;">✓ Payment Successfully Processed</p>
              <p style="margin:4px 0 0;font-size:28px;font-weight:900;color:#15803d;">$${formattedAmount}</p>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0;color:#64748b;width:180px;">Confirmation #</td><td style="padding:10px 0;font-weight:bold;font-family:monospace;">${confirmationNumber}</td></tr>
              <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0;color:#64748b;">Citation #</td><td style="padding:10px 0;font-weight:bold;">${citationNumber}</td></tr>
              <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0;color:#64748b;">Violation</td><td style="padding:10px 0;">${violationType}</td></tr>
              <tr><td style="padding:10px 0;color:#64748b;">Payment Date</td><td style="padding:10px 0;">${formattedDate}</td></tr>
            </table>
            <p style="font-size:13px;color:#64748b;margin-top:24px;padding-top:16px;border-top:1px solid #f1f5f9;">
              Please retain this confirmation for your records. For questions, call <strong>(740) 568-7800</strong>.
            </p>
          </div>
          <div style="padding:12px;text-align:center;font-size:12px;color:#94a3b8;">
            © ${new Date().getFullYear()} Village of Saint Louisville, Ohio — Police Department
          </div>
        </div>`,
    },
  }
  const poller = await emailClient.beginSend(message)
  await poller.pollUntilDone()
}

module.exports = async function (context, req) {
  const h = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  }
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: { ...h, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' } }
    return
  }
  if (req.method !== 'POST') {
    context.res = { status: 405, headers: h, body: { message: 'Method not allowed' } }
    return
  }

  const { citationId, citationStatus, amount, cardLast4, receiptEmail } = req.body || {}
  if (!citationId || !citationStatus || !amount || !cardLast4) {
    context.res = { status: 400, headers: h, body: { message: 'citationId, citationStatus, amount, and cardLast4 are required' } }
    return
  }
  const parsedAmount = parseFloat(amount)
  if (!parsedAmount || parsedAmount <= 0 || parsedAmount > 100000) {
    context.res = { status: 400, headers: h, body: { message: 'Invalid payment amount' } }
    return
  }
  if (!/^\d{4}$/.test(cardLast4)) {
    context.res = { status: 400, headers: h, body: { message: 'Invalid card information' } }
    return
  }

  try {
    getClients()
    const citationsContainer = _cosmosClient.database('pddb').container('citations')
    const paymentsContainer = _cosmosClient.database('pddb').container('finePayments')

    const { resource: citation } = await citationsContainer.item(citationId, citationStatus).read()
    if (!citation) {
      context.res = { status: 404, headers: h, body: { message: 'Citation not found' } }
      return
    }
    if (citation.balance <= 0) {
      context.res = { status: 400, headers: h, body: { message: 'This citation has no outstanding balance.' } }
      return
    }

    // ── Payment processor integration point ──────────────────────
    // TODO: Replace with real processor, e.g.:
    //   const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
    //   const charge = await stripe.charges.create({ amount: Math.round(parsedAmount * 100), currency: 'usd', source: paymentToken })
    const processorResult = { success: true, transactionId: `SIM-${uuidv4()}` }

    if (!processorResult.success) {
      context.res = { status: 402, headers: h, body: { message: 'Payment declined. Please check your card details and try again.' } }
      return
    }

    const confirmationNumber = generateConfirmationNumber()
    const paymentDate = new Date().toISOString()
    const newBalance = Math.max(0, citation.balance - parsedAmount)
    const newPaidAmount = (citation.paidAmount || 0) + parsedAmount
    const newStatus = newBalance <= 0 ? 'paid' : citation.status

    // Record the payment
    await paymentsContainer.items.create({
      id: uuidv4(),
      citationNumber: citation.citationNumber,
      citationId,
      amount: parsedAmount,
      cardLast4,
      confirmationNumber,
      processorTransactionId: processorResult.transactionId,
      paymentDate,
      status: 'completed',
      createdAt: paymentDate,
    })

    // Update citation balance — if status changed, delete + recreate (partition key)
    const updatedCitation = { ...citation, balance: newBalance, paidAmount: newPaidAmount, status: newStatus, lastPaymentDate: paymentDate, updatedAt: paymentDate }
    if (newStatus !== citation.status) {
      await citationsContainer.item(citationId, citation.status).delete()
      await citationsContainer.items.create(updatedCitation)
    } else {
      await citationsContainer.item(citationId, citation.status).replace(updatedCitation)
    }

    // Send receipt
    if (receiptEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(receiptEmail)) {
      try {
        await sendReceiptEmail(_emailClient, {
          toAddress: receiptEmail,
          citationNumber: citation.citationNumber,
          amount: parsedAmount,
          confirmationNumber,
          violationType: citation.violationType,
        })
      } catch (emailErr) {
        context.log.error('Receipt email failed:', emailErr.message)
      }
    }

    context.log(`Fine payment confirmed: ${confirmationNumber} for citation ${citation.citationNumber}`)
    context.res = {
      status: 200,
      headers: h,
      body: {
        success: true,
        confirmationNumber,
        citationNumber: citation.citationNumber,
        amount: parsedAmount,
        newBalance,
        paymentDate,
      },
    }
  } catch (err) {
    context.log.error('Fine payment error:', err.message)
    context.res = { status: 500, headers: h, body: { message: 'Payment processing failed. Please try again or call (740) 568-7800.' } }
  }
}
