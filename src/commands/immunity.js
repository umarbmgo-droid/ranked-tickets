const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../handlers/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('immunity')
    .setDescription('Grant or revoke a role\'s access to all tickets.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt
        .setName('action')
        .setDescription('Add or remove the immunity role.')
        .setRequired(true)
        .addChoices(
          { name: 'Add', value: 'add' },
          { name: 'Remove', value: 'remove' }
        )
    )
    .addRoleOption(opt =>
      opt
        .setName('role')
        .setDescription('The role to grant or revoke ticket immunity.')
        .setRequired(true)
    ),

  async execute(interaction) {
    const action = interaction.options.getString('action');
    const role = interaction.options.getRole('role');
    const guildData = db.getGuild(interaction.guild.id);

    let immunityRoles = guildData.immunityRoles || [];

    if (action === 'add') {
      if (immunityRoles.includes(role.id)) {
        return interaction.reply({
          content: `${role} already has immunity.`,
          ephemeral: true
        });
      }
      immunityRoles.push(role.id);
      db.setGuild(interaction.guild.id, { immunityRoles });

      const embed = new EmbedBuilder()
        .setDescription(`${role} has been granted immunity and can now view all tickets.`)
        .setColor(0xD90000)
        .setFooter({ text: 'Ranked Tickets' });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (action === 'remove') {
      if (!immunityRoles.includes(role.id)) {
        return interaction.reply({
          content: `${role} does not have immunity.`,
          ephemeral: true
        });
      }
      immunityRoles = immunityRoles.filter(id => id !== role.id);
      db.setGuild(interaction.guild.id, { immunityRoles });

      const embed = new EmbedBuilder()
        .setDescription(`${role}'s immunity has been revoked.`)
        .setColor(0xD90000)
        .setFooter({ text: 'Ranked Tickets' });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};
