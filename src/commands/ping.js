const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot\'s response latency.'),

  async execute(interaction) {
    const sent = await interaction.deferReply({ ephemeral: true, fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const wsLatency = interaction.client.ws.ping;

    const embed = new EmbedBuilder()
      .setTitle('Latency')
      .addFields(
        { name: 'Roundtrip', value: `${latency}ms`, inline: true },
        { name: 'WebSocket', value: `${wsLatency}ms`, inline: true }
      )
      .setColor(latency < 200 ? 0x57F287 : latency < 500 ? 0xFEE75C : 0xED4245)
      .setFooter({ text: 'Ranked Tickets' })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
};
