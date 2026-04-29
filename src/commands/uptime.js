const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function formatUptime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(' ');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('Check how long the bot has been online.'),

  async execute(interaction) {
    const uptime = formatUptime(interaction.client.uptime);

    const embed = new EmbedBuilder()
      .setTitle('Uptime')
      .setDescription(`The bot has been online for **${uptime}**.`)
      .setColor(0xD90000)
      .setFooter({ text: 'Ranked Tickets' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
