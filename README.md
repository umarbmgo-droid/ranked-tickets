# Ranked Tickets

A professional ranked support ticket bot for Discord.

---

## Features

- Dropdown-based ticket panel (no buttons, clean select menu)
- Separate Discord categories for each ticket type: Hacks, Alts, Queues, General
- Separate transcript category with individual transcript channels per ticket
- Spam protection: one active ticket per user, 1-hour cooldown after closing
- Staff roles per category via `/staffrole`
- Immunity roles (access all tickets) via `/immunity`
- `/setup` — owner-only, initializes all categories and panel channel
- `/panel` — sends the panel to any channel (admin only)
- `/ping` — bot latency
- `/uptime` — how long the bot has been running
- Streams "Handling Tickets" as its Discord activity

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```
TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
```

- `TOKEN` — Your bot token from the [Discord Developer Portal](https://discord.com/developers/applications)
- `CLIENT_ID` — Your bot's application/client ID

### 3. Register slash commands

```bash
node deploy-commands.js
```

Run this once. Commands will be registered globally (may take up to 1 hour to propagate).

### 4. Start the bot

```bash
npm start
```

### 5. Run `/setup` in your server

In Discord, run `/setup` in your server. **Only the bot owner can run this command.** It will create:

- `Hacks Tickets` category
- `Alts Tickets` category
- `Queues Tickets` category
- `General Tickets` category
- `Transcripts` category
- `#ranked-support` channel with the panel

---

## Deploying to Railway

1. Push this project to a GitHub repository.
2. Go to [railway.app](https://railway.app) and create a new project from your repo.
3. Add the following environment variables in Railway's dashboard:
   - `TOKEN`
   - `CLIENT_ID`
4. Railway will automatically detect the start command from `railway.toml` or `Procfile`.
5. Deploy. The bot will start automatically.

> **Note:** Railway's free tier may have uptime limits. Consider a paid plan for 24/7 hosting.

---

## Commands

| Command | Description | Permission |
|---|---|---|
| `/setup` | Initialize Ranked Tickets in the server | Bot owner only |
| `/panel` | Send the support panel to this channel | Manage Server |
| `/staffrole <category> <role>` | Set a staff role for a ticket category | Administrator |
| `/immunity <add/remove> <role>` | Grant or revoke a role's access to all tickets | Administrator |
| `/ping` | Check bot latency | Everyone |
| `/uptime` | Check how long the bot has been online | Everyone |

---

## Bot Permissions Required

The bot requires the following permissions in your server:

- `Manage Channels` — to create ticket and transcript channels
- `Manage Roles` — to apply permission overwrites
- `Send Messages`
- `Read Message History`
- `Embed Links`
- `Attach Files`
- `View Channels`

The easiest approach is to grant the bot the **Administrator** permission.
