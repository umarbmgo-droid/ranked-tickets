const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { buildPanel } = require('../handlers/panel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Send the support panel to this channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      await interaction.channel.send(buildPanel());
      return interaction.editReply({ content: 'Panel sent.' });
    } catch (err) {
      console.error('[panel] Error sending panel:', err);
      return interaction.editReply({
        content: 'Failed to send the panel. Ensure the bot has permission to send messages in this channel.'
      });
    }
  }
};
