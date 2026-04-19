// functions/water-api/payment/index.js
//
// IMPORTANT: This function handles payment CONFIRMATION and records.
// In production, integrate a real payment processor (Stripe, Authorize.net, PaySimple)
// and call their API here — never process raw card data yourself.
// The card details from the frontend go to the processor's SDK (client-side tokenization
// is strongly preferred). This function receives a payment token + amount, confirms
// with the processor, then records the transaction and sends a receipt.
//
// For a municipality, PaySimple or Stripe's government-friendly plans are recommended.

const { CosmosClient } = require('@azure/cosmos')
const { EmailClient } = require('@azure/communication-email')
const { DefaultAzureCredential } = require('@azure/identity')
const { SecretClient } = require('@azure/keyvault-secrets')
const { v4: uuidv4 } = require('uuid')

let _cosmosClient = null
let _emailClient = null

async function bootstrap() {
  if (_cosmosClient && _emailClient) return
  const cred = new DefaultAzureCredential()
  const kv = new SecretClient(process.env.KEY_VAULT_URI, cred)
  const [cosmosSecret, commSecret] = await Promise.all([
    kv.getSecret('cosmos-connection-string'),
    kv.getSecret('communication-connection-string'),
  ])
  _cosmosClient = new CosmosClient(cosmosSecret.value)
  _emailClient = new EmailClient(commSecret.value)
}

function generateConfirmationNumber() {
  const now = new Date()
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const random = Math.random().toString(36).toUpperCase().slice(2, 7)
  return `SLW-${ymd}-${random}`
}

async function sendReceiptEmail(emailClient, { toAddress, accountNumber, amount, confirmationNumber, address }) {
  const formattedAmount = parseFloat(amount).toFixed(2)
  const formattedDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })

  const message = {
    senderAddress: 'donotreply@saintlouisvilleohio.gov',
    recipients: { to: [{ address: toAddress }] },
    content: {
      subject: `Water Bill Payment Confirmation — ${confirmationNumber}`,
      plainText: [
        'Village of Saint Louisville, Ohio — Water Department',
        'Payment Confirmation',
        '',
        `Confirmation Number: ${confirmationNumber}`,
        `Account Number:      ${accountNumber}`,
        `Service Address:     ${address}`,
        `Payment Amount:      $${formattedAmount}`,
        `Payment Date:        ${formattedDate}`,
        '',
        'Your payment has been processed. Please allow 1-2 business days for your balance to update.',
        '',
        'Questions? Call (740) 568-7800 or email water@saintlouisvilleohio.gov',
        '',
        '---',
        'Village of Saint Louisville, Ohio',
        'Water Department',
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;">
          <div style="background:#1e3a8a;color:white;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
            <h1 style="margin:0;font-size:22px;">💧 Payment Confirmed</h1>
            <p style="margin:8px 0 0;opacity:0.8;font-size:14px;">Village of Saint Louisville — Water Department</p>
          </div>
          <div style="background:white;padding:32px;border:1px solid #e2e8f0;border-top:none;">
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;text-align:center;margin-bottom:24px;">
              <p style="margin:0;font-size:14px;color:#16a34a;font-weight:bold;">✓ Payment Successfully Processed</p>
              <p style="margin:4px 0 0;font-size:28px;font-weight:900;color:#15803d;">$${formattedAmount}</p>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0;color:#64748b;width:180px;">Confirmation Number</td><td style="padding:10px 0;font-weight:bold;font-family:monospace;">${confirmationNumber}</td></tr>
              <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0;color:#64748b;">Account Number</td><td style="padding:10px 0;font-weight:bold;">${accountNumber}</td></tr>
              <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0;color:#64748b;">Service Address</td><td style="padding:10px 0;">${address}</td></tr>
              <tr><td style="padding:10px 0;color:#64748b;">Payment Date</td><td style="padding:10px 0;">${formattedDate}</td></tr>
            </table>
            <p style="font-size:13px;color:#64748b;margin-top:24px;padding-top:16px;border-top:1px solid #f1f5f9;">
              Please allow 1–2 business days for your balance to reflect this payment. 
              For questions, call <strong>(740) 568-7800</strong> or email 
              <a href="mailto:water@saintlouisvilleohio.gov">water@saintlouisvilleohio.gov</a>.
            </p>
          </div>
          <div style="padding:12px;text-align:center;font-size:12px;color:#94a3b8;">
            © ${new Date().getFullYear()} Village of Saint Louisville, Ohio
          </div>
        </div>`,
    },
  }

  const poller = await emailClient.beginSend(message)
  await poller.pollUntilDone()
}

module.exports = async function (context, req) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  }

  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' } }
    return
  }

  if (req.method !== 'POST') {
    context.res = { status: 405, headers, body: { message: 'Method not allowed' } }
    return
  }

  const { accountNumber, amount, cardLast4, alertOptIn, alertEmail } = req.body || {}

  // Validate inputs
  if (!accountNumber?.trim()) {
    context.res = { status: 400, headers, body: { message: 'accountNumber is required' } }
    return
  }
  const parsedAmount = parseFloat(amount)
  if (!parsedAmount || parsedAmount <= 0 || parsedAmount > 10000) {
    context.res = { status: 400, headers, body: { message: 'Invalid payment amount' } }
    return
  }
  if (!cardLast4 || !/^\d{4}$/.test(cardLast4)) {
    context.res = { status: 400, headers, body: { message: 'Invalid card information' } }
    return
  }

  try {
    await bootstrap()

    const accountsContainer = _cosmosClient.database('waterdb').container('accounts')
    const paymentsContainer = _cosmosClient.database('waterdb').container('payments')
    const alertsContainer = _cosmosClient.database('waterdb').container('alertSubscriptions')

    // Fetch the account to verify it exists and get address
    const acctQuery = 'SELECT * FROM c WHERE c.accountNumber = @acct'
    const { resources: accounts } = await accountsContainer.items
      .query({ query: acctQuery, parameters: [{ name: '@acct', value: accountNumber.trim().toUpperCase() }] })
      .fetchAll()

    if (!accounts.length) {
      context.res = { status: 404, headers, body: { message: 'Account not found' } }
      return
    }

    const account = accounts[0]

    // ── Payment processor integration point ──────────────────
    // TODO: Replace with real payment processor call, e.g.:
    //   const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
    //   const charge = await stripe.charges.create({ amount: Math.round(parsedAmount * 100), currency: 'usd', source: paymentToken, description: `Water bill ${accountNumber}` })
    // For now, we simulate a successful payment:
    const processorResult = {
      success: true,
      transactionId: `SIM-${uuidv4()}`,
    }

    if (!processorResult.success) {
      context.res = { status: 402, headers, body: { message: 'Payment declined. Please check your card details and try again.' } }
      return
    }

    const confirmationNumber = generateConfirmationNumber()
    const paymentDate = new Date().toISOString()

    // Record payment in Cosmos DB
    const paymentRecord = {
      id: uuidv4(),
      accountNumber: accountNumber.trim().toUpperCase(),
      amount: parsedAmount,
      cardLast4,
      confirmationNumber,
      processorTransactionId: processorResult.transactionId,
      paymentDate,
      status: 'completed',
      createdAt: paymentDate,
    }

    await paymentsContainer.items.create(paymentRecord)

    // Update account balance in Cosmos DB
    const newBalance = Math.max(0, (account.balance || 0) - parsedAmount)
    await accountsContainer.item(account.id, account.accountNumber).replace({
      ...account,
      balance: newBalance,
      lastPayment: { amount: parsedAmount, date: paymentDate, confirmationNumber },
      updatedAt: paymentDate,
    })

    // Handle alert opt-in
    if (alertOptIn && alertEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(alertEmail)) {
      const alertRecord = {
        id: uuidv4(),
        accountNumber: accountNumber.trim().toUpperCase(),
        email: alertEmail.toLowerCase().trim(),
        optedInAt: paymentDate,
        active: true,
      }
      // Upsert — use accountNumber as the key to avoid duplicates
      const existing = await alertsContainer.items
        .query({ query: 'SELECT * FROM c WHERE c.accountNumber = @acct', parameters: [{ name: '@acct', value: alertRecord.accountNumber }] })
        .fetchAll()

      if (existing.resources.length) {
        await alertsContainer.item(existing.resources[0].id, alertRecord.accountNumber).replace({ ...existing.resources[0], email: alertRecord.email, optedInAt: paymentDate, active: true })
      } else {
        await alertsContainer.items.create(alertRecord)
      }
    }

    // Send receipt email
    const receiptEmail = alertOptIn && alertEmail ? alertEmail : account.email
    if (receiptEmail) {
      try {
        await sendReceiptEmail(_emailClient, {
          toAddress: receiptEmail,
          accountNumber: accountNumber.trim().toUpperCase(),
          amount: parsedAmount,
          confirmationNumber,
          address: account.address,
        })
      } catch (emailErr) {
        // Email failure should not fail the payment — log and continue
        context.log.error('Receipt email failed:', emailErr.message)
      }
    }

    context.log(`Payment confirmed: ${confirmationNumber} for account ${accountNumber} — $${parsedAmount}`)

    context.res = {
      status: 200,
      headers,
      body: {
        success: true,
        confirmationNumber,
        amount: parsedAmount,
        accountNumber: accountNumber.trim().toUpperCase(),
        newBalance,
        paymentDate,
      },
    }

  } catch (err) {
    context.log.error('Payment function error:', err.message)
    context.res = {
      status: 500,
      headers,
      body: { message: 'Payment processing failed. Please try again or call (740) 568-7800.' },
    }
  }
}
