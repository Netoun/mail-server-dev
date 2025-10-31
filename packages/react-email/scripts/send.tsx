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
    subject: "Welcome to Stripe!",
    from: "noreply@stripe.com",
    component: <StripeWelcomeEmail />,
    text: "Thank you for submitting your account information. You're now ready to process live transactions with Stripe!",
  },
  plaid: {
    subject: "Verify your identity",
    from: "noreply@plaid.com",
    component: <PlaidVerifyIdentityEmail validationCode="123456" />,
    text: "Use this code to verify your identity: 123456",
  },
  notion: {
    subject: "Your magic link",
    from: "noreply@notion.so",
    component: <NotionMagicLinkEmail loginCode="123456" />,
    text: "Your login code: 123456",
  },
  vercel: {
    subject: "You've been invited to join the team",
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
    text: "You've been invited to join the Acme Inc team on Vercel.",
  },
};

async function sendEmail(type: string) {
  const config = emailConfigs[type];
  
  if (!config) {
    console.error(`❌ Unknown email type: ${type}`);
    console.log('Available types:', Object.keys(emailConfigs).join(', '));
    process.exit(1);
  }

  try {
    console.log(`📧 Generating HTML for ${type}...`);
    const html = await render(config.component);

    console.log(`📤 Sending email "${config.subject}"...`);
    const info = await transporter.sendMail({
      from: config.from,
      to: 'recipient@example.com',
      subject: config.subject,
      html,
      text: config.text || config.subject,
    });

    console.log('✅ Email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Check the web interface at http://localhost:1080`);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    process.exit(1);
  }
}

// Main
const emailType = process.argv[2];

if (!emailType) {
  console.error('❌ Usage: bun run send:<type>');
  console.log('Available types:');
  Object.keys(emailConfigs).forEach(type => {
    console.log(`  - ${type}: ${emailConfigs[type].subject}`);
  });
  process.exit(1);
}

sendEmail(emailType);

