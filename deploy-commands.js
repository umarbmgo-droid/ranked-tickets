require('dotenv').config();

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
  console.error('[fatal] TOKEN and CLIENT_ID must be set in your .env file.');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'src', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.data) {
    commands.push(command.data.toJSON());
    console.log(`[deploy] Queued: /${command.data.name}`);
  }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`[deploy] Registering ${commands.length} command(s) globally...`);
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log('[deploy] All commands registered successfully.');
  } catch (err) {
    console.error('[deploy] Failed to register commands:', err);
    process.exit(1);
  }
})();
