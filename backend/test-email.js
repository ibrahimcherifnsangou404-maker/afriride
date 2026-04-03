#!/usr/bin/env node

/**
 * SCRIPT DE TEST EMAIL
 * Usage: node test-email.js
 */

const dotenv = require('dotenv');
const path = require('path');
const nodemailer = require('nodemailer');

dotenv.config({ path: path.join(__dirname, '.env') });

const logDivider = () => console.log('═'.repeat(50));

const verifySmtp = async () => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  await transporter.verify();

  const testEmail = process.env.EMAIL_USER;
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: testEmail,
    subject: 'Test Configuration Email - AfriRide',
    html: `
      <div style="font-family: Arial; padding: 20px;">
        <h2 style="color: #667eea;">Configuration Email Reussie!</h2>
        <p>Ce message confirme que le serveur AfriRide peut envoyer des emails.</p>
        <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Email From:</strong> ${process.env.EMAIL_FROM}</p>
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString('fr-FR')}</p>
          <p><strong>Status:</strong> OK</p>
        </div>
      </div>
    `
  });

  console.log('Email de test envoye avec succes.');
  console.log(`Message ID: ${info.messageId}`);
  console.log(`Destinataire: ${testEmail}`);
};

const verifyResend = async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const payload = {
      from: process.env.EMAIL_FROM,
      to: [process.env.EMAIL_FROM],
      subject: 'Test Configuration Email - AfriRide',
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2 style="color: #667eea;">Configuration Email Reussie (Resend)!</h2>
          <p>Ce message confirme que le serveur AfriRide peut envoyer des emails via Resend.</p>
          <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Email From:</strong> ${process.env.EMAIL_FROM}</p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString('fr-FR')}</p>
            <p><strong>Status:</strong> OK</p>
          </div>
        </div>
      `
    };

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || `HTTP ${res.status}`);
    }

    console.log('Email de test envoye via Resend.');
    console.log(`Message ID: ${data?.id || 'N/A'}`);
  } finally {
    clearTimeout(timeout);
  }
};

const main = async () => {
  console.log('\nTEST DE CONFIGURATION EMAIL\n');
  logDivider();
  console.log('\nVARIABLES D\'ENVIRONNEMENT:\n');

  const isResend = Boolean(process.env.RESEND_API_KEY);
  const requiredVars = isResend
    ? ['RESEND_API_KEY', 'EMAIL_FROM']
    : ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM'];

  let allSet = true;
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      const masked = varName === 'EMAIL_PASSWORD' ? '**********' : value;
      console.log(`OK ${varName}: ${masked}`);
    } else {
      console.log(`KO ${varName}: NON CONFIGURE`);
      allSet = false;
    }
  }

  if (!allSet) {
    throw new Error('Certaines variables email ne sont pas configurees dans backend/.env');
  }

  console.log(`\nMode detecte: ${isResend ? 'Resend API' : 'SMTP / Nodemailer'}\n`);

  if (isResend) {
    await verifyResend();
  } else {
    await verifySmtp();
  }

  console.log('\nConfiguration email operationnelle.');
  logDivider();
};

main()
  .then(() => {
    process.exitCode = 0;
  })
  .catch((error) => {
    console.error('\nErreur test email:');
    console.error(error.message || error);
    process.exitCode = 1;
  });
