#!/usr/bin/env node

/**
 * SCRIPT DE TEST EMAIL
 * Usage: node test-email.js
 * 
 * Ce script teste la configuration Gmail
 */

const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('\n🔧 TEST DE CONFIGURATION EMAIL\n');
console.log('═'.repeat(50));

// 1. Vérifier les variables
console.log('\n📋 VARIABLES D\'ENVIRONNEMENT:\n');

const requiredVars = [
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'EMAIL_FROM'
];

let allSet = true;
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const masked = varName === 'EMAIL_PASSWORD' ? '●'.repeat(10) : value;
    console.log(`✅ ${varName}: ${masked}`);
  } else {
    console.log(`❌ ${varName}: NON CONFIGURÉ`);
    allSet = false;
  }
});

if (!allSet) {
  console.log('\n❌ ERREUR: Certaines variables ne sont pas configurées!');
  console.log('Veuillez éditer backend/.env et remplir toutes les valeurs.');
  process.exit(1);
}

// 2. Tester la connexion
console.log('\n\n📧 TEST DE CONNEXION AU SERVEUR EMAIL:\n');

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Erreur de connexion:');
    console.log(error.message);
    console.log('\n🔍 SOLUTIONS:\n');
    
    if (error.message.includes('Invalid login')) {
      console.log('1. Vérifiez votre EMAIL_USER et EMAIL_PASSWORD');
      console.log('2. Assurez-vous d\'utiliser un MOT DE PASSE D\'APPLICATION');
      console.log('3. La vérification en 2 étapes doit être ACTIVÉE');
      console.log('4. Rendez-vous sur: https://myaccount.google.com/apppasswords');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('1. Vérifiez votre connexion internet');
      console.log('2. Vérifiez que EMAIL_HOST est correct');
      console.log('3. Testez: ping smtp.gmail.com');
    }
    process.exit(1);
  } else {
    console.log('✅ Connexion réussie au serveur SMTP!');
    console.log('\n📤 TEST D\'ENVOI D\'EMAIL:\n');
    
    // 3. Envoyer un email de test
    const testEmail = process.env.EMAIL_USER; // Envoyer à soi-même
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: testEmail,
      subject: '✅ Test Configuration Email - AfriRide',
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2 style="color: #667eea;">✅ Configuration Email Réussie!</h2>
          <p>Ce email a été envoyé avec succès depuis votre serveur AfriRide.</p>
          <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Détails:</strong></p>
            <p>Email From: ${process.env.EMAIL_FROM}</p>
            <p>Timestamp: ${new Date().toLocaleString('fr-FR')}</p>
            <p>Status: ✅ OK</p>
          </div>
          <p style="color: #666; font-size: 12px;">Vous pouvez maintenant utiliser le système de notifications d'AfriRide.</p>
        </div>
      `
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('❌ Erreur lors de l\'envoi:');
        console.log(error.message);
        process.exit(1);
      } else {
        console.log('✅ Email de test envoyé avec succès!');
        console.log(`📨 Message ID: ${info.messageId}`);
        console.log(`📧 Destinataire: ${testEmail}`);
        console.log('\n🎉 Configuration Email est COMPLÈTE ET OPÉRATIONNELLE!\n');
        console.log('═'.repeat(50));
        console.log('\nVotre système de notifications est prêt.');
        console.log('Les emails seront envoyés automatiquement pour:\n');
        console.log('  ✉️  Inscription des utilisateurs');
        console.log('  ✉️  Confirmation de réservation');
        console.log('  ✉️  Rappel de paiement');
        console.log('  ✉️  Contrat avec PDF');
        console.log('  ✉️  Notification de signature');
        console.log('\n═'.repeat(50) + '\n');
        process.exit(0);
      }
    });
  }
});
