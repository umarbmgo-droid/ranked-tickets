require('dotenv').config();

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

// ── Client ────────────────────────────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

// ── Load commands ─────────────────────────────────────────────────────────────

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (!command.data || !command.execute) {
    console.warn(`[warn] Skipping ${file} — missing data or execute.`);
    continue;
  }
  client.commands.set(command.data.name, command);
  console.log(`[commands] Loaded: /${command.data.name}`);
}

// ── Load events ───────────────────────────────────────────────────────────────

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
  console.log(`[events] Registered: ${event.name}`);
}

// ── Login ─────────────────────────────────────────────────────────────────────

const token = process.env.TOKEN;
if (!token) {
  console.error('[fatal] TOKEN is not set in environment variables.');
  process.exit(1);
}

client.login(token).catch(err => {
  console.error('[fatal] Failed to log in:', err.message);
  process.exit(1);
});

// ── Unhandled errors ──────────────────────────────────────────────────────────

process.on('unhandledRejection', err => {
  console.error('[unhandledRejection]', err);
});

process.on('uncaughtException', err => {
  console.error('[uncaughtException]', err);
});
