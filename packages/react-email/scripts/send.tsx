import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import * as React from 'react';
import { StripeWelcomeEmail } from '../emails/stripe-welcome';
import { PlaidVerifyIdentityEmail } from '../emails/plaid-verify-identity';
import { NotionMagicLinkEmail } from '../emails/notion-magic-link';
import { VercelInviteUserEmail } from '../emails/vercel-invite-user';

const transporter = nodemailer.createTransport({
  host: '127.0.0.1',
  port: 1025,
  secure: false,
  tls: {
    rejectUnauthorized: false,
  },
});

interface EmailConfig {
  subject: string;
  from: string;
  component: React.ReactElement;
  text?: string;
}

const emailConfigs: Record<string, EmailConfig> = {
  stripe: {
    subject: "Bienvenue sur Stripe!",
    from: "noreply@stripe.com",
    component: <StripeWelcomeEmail />,
    text: "Merci d'avoir soumis vos informations de compte. Vous êtes maintenant prêt à effectuer des transactions en direct avec Stripe!",
  },
  plaid: {
    subject: "Vérifiez votre identité",
    from: "noreply@plaid.com",
    component: <PlaidVerifyIdentityEmail validationCode="123456" />,
    text: "Utilisez ce code pour vérifier votre identité: 123456",
  },
  notion: {
    subject: "Votre lien de connexion magique",
    from: "noreply@notion.so",
    component: <NotionMagicLinkEmail loginCode="123456" />,
    text: "Votre code de connexion: 123456",
  },
  vercel: {
    subject: "Vous avez été invité à rejoindre l'équipe",
    from: "noreply@vercel.com",
    component: <VercelInviteUserEmail 
      username="John Doe"
      userImage="https://vercel.com/api/www/avatar/john"
      invitedByUsername="Jane Smith"
      invitedByEmail="jane@example.com"
      inviteLink="https://vercel.com/teams/invite/token123"
      teamName="Acme Inc"
      teamImage="https://vercel.com/api/www/team/acme"
      inviteFromIp="192.168.1.1"
      inviteFromLocation="Paris, France"
    />,
    text: "Vous avez été invité à rejoindre l'équipe Acme Inc sur Vercel.",
  },
};

async function sendEmail(type: string) {
  const config = emailConfigs[type];
  
  if (!config) {
    console.error(`❌ Type d'email inconnu: ${type}`);
    console.log('Types disponibles:', Object.keys(emailConfigs).join(', '));
    process.exit(1);
  }

  try {
    console.log(`📧 Génération du HTML pour ${type}...`);
    const html = await render(config.component);

    console.log(`📤 Envoi de l'email "${config.subject}"...`);
    const info = await transporter.sendMail({
      from: config.from,
      to: 'recipient@example.com',
      subject: config.subject,
      html,
      text: config.text || config.subject,
    });

    console.log('✅ Email envoyé avec succès!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Vérifiez l'interface web sur http://localhost:1080`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi:', error);
    process.exit(1);
  }
}

// Main
const emailType = process.argv[2];

if (!emailType) {
  console.error('❌ Usage: bun run send:<type>');
  console.log('Types disponibles:');
  Object.keys(emailConfigs).forEach(type => {
    console.log(`  - ${type}: ${emailConfigs[type].subject}`);
  });
  process.exit(1);
}

sendEmail(emailType);

