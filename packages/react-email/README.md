# React Email Templates

Templates d'emails utilisant React Email pour tester le serveur SMTP local.

## Installation

```sh
bun install
```

## Utilisation

### Prévisualiser les emails

```sh
bun run dev
```

Ouvre [localhost:3000](http://localhost:3000) pour prévisualiser les templates dans votre navigateur.

### Exporter les emails (générer HTML)

```sh
bun run export
```

Génère les fichiers HTML statiques.

### Envoyer des emails via SMTP local

Assurez-vous que le serveur SMTP est démarré (`docker-compose up`), puis :

```sh
# Envoyer un email Stripe
bun run send:stripe

# Envoyer un email Plaid (vérification d'identité)
bun run send:plaid

# Envoyer un email Notion (magic link)
bun run send:notion

# Envoyer un email Vercel (invitation équipe)
bun run send:vercel
```

Les emails seront envoyés au serveur SMTP local (port 1025) et apparaîtront dans l'interface web sur [http://localhost:1080](http://localhost:1080).

## Templates disponibles

- **Stripe Welcome** - Email de bienvenue Stripe
- **Plaid Verify Identity** - Email de vérification d'identité Plaid
- **Notion Magic Link** - Lien de connexion magique Notion
- **Vercel Invite User** - Invitation à rejoindre une équipe Vercel

## License

MIT License
