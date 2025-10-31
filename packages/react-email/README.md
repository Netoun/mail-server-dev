# React Email Templates

Email templates using React Email to test the local SMTP server.

## Installation

```sh
bun install
```

## Usage

### Preview emails

```sh
bun run dev
```

Opens [localhost:3000](http://localhost:3000) to preview templates in your browser.

### Export emails (generate HTML)

```sh
bun run export
```

Generates static HTML files.

### Send emails via local SMTP

Make sure the SMTP server is running (`docker-compose up`), then:

```sh
# Send a Stripe email
bun run send:stripe

# Send a Plaid email (identity verification)
bun run send:plaid

# Send a Notion email (magic link)
bun run send:notion

# Send a Vercel email (team invitation)
bun run send:vercel
```

Emails will be sent to the local SMTP server (port 1025) and will appear in the web interface at [http://localhost:1080](http://localhost:1080).

## Available templates

- **Stripe Welcome** - Stripe welcome email
- **Plaid Verify Identity** - Plaid identity verification email
- **Notion Magic Link** - Notion magic link email
- **Vercel Invite User** - Vercel team invitation email

## License

MIT License
