const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../handlers/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Add a user to the current ticket.')
    .addUserOption(opt =>
      opt
        .setName('user')
        .setDescription('The user to add to this ticket.')
        .setRequired(true)
    ),

  async execute(interaction) {
    const ticketData = db.getTicket(interaction.channel.id);

    if (!ticketData) {
      return interaction.reply({
        content: 'This command can only be used inside a ticket channel.',
        ephemeral: true
      });
    }

    const guildData = db.getGuild(interaction.guild.id);
    const member = interaction.member;

    // Only ticket owner, staff, immunity roles, or admins can add users
    const isOwner = interaction.user.id === ticketData.userId;
    const staffRoleId = guildData.staffRoles[ticketData.category];
    const isStaff = staffRoleId && member.roles.cache.has(staffRoleId);
    const isImmune = (guildData.immunityRoles || []).some(rid => member.roles.cache.has(rid));
    const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isOwner && !isStaff && !isImmune && !isAdmin) {
      return interaction.reply({
        content: 'You do not have permission to add users to this ticket.',
        ephemeral: true
      });
    }

    const target = interaction.options.getUser('user');
    const targetMember = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!targetMember) {
      return interaction.reply({
        content: 'That user could not be found in this server.',
        ephemeral: true
      });
    }

    // Check if user already has access
    const existingOverwrite = interaction.channel.permissionOverwrites.cache.get(target.id);
    if (existingOverwrite && existingOverwrite.allow.has(PermissionFlagsBits.ViewChannel)) {
      return interaction.reply({
        content: `${target} already has access to this ticket.`,
        ephemeral: true
      });
    }

    try {
      await interaction.channel.permissionOverwrites.create(target.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true,
        EmbedLinks: true
      });
    } catch (err) {
      console.error('[add] Failed to update permissions:', err);
      return interaction.reply({
        content: 'Failed to add the user. Please ensure the bot has the correct permissions.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setDescription(`${target} has been added to this ticket by ${interaction.user}.`)
      .setColor(0xD90000)
      .setFooter({ text: 'Ranked Tickets' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
