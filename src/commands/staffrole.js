const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../handlers/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('staffrole')
    .setDescription('Assign a staff role to a ticket category.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt
        .setName('category')
        .setDescription('The ticket category to assign the role to.')
        .setRequired(true)
        .addChoices(
          { name: 'Hacks', value: 'hacks' },
          { name: 'Alts', value: 'alts' },
          { name: 'Queues', value: 'queues' },
          { name: 'General', value: 'general' }
        )
    )
    .addRoleOption(opt =>
      opt
        .setName('role')
        .setDescription('The role to assign as staff for this category.')
        .setRequired(true)
    ),

  async execute(interaction) {
    const category = interaction.options.getString('category');
    const role = interaction.options.getRole('role');
    const guildData = db.getGuild(interaction.guild.id);

    guildData.staffRoles[category] = role.id;
    db.setGuild(interaction.guild.id, { staffRoles: guildData.staffRoles });

    const labels = { hacks: 'Hacks', alts: 'Alts', queues: 'Queues', general: 'General' };

    const embed = new EmbedBuilder()
      .setDescription(`${role} has been set as the staff role for **${labels[category]}** tickets.`)
      .setColor(0xD90000)
      .setFooter({ text: 'Ranked Tickets' });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
