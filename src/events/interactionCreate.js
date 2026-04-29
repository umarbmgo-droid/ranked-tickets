const { Events, EmbedBuilder } = require('discord.js');
const { openTicket } = require('../handlers/ticket');
const { saveTranscript } = require('../handlers/transcript');
const db = require('../handlers/db');

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction) {
    // ── Slash commands ───────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(`[command:${interaction.commandName}]`, err);
        const msg = { content: 'An error occurred while executing this command.', ephemeral: true };
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply(msg).catch(() => {});
        } else {
          await interaction.reply(msg).catch(() => {});
        }
      }
      return;
    }

    // ── Select menu: open ticket ─────────────────────────────────────────────
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_open') {
      await interaction.deferReply({ ephemeral: true });

      const category = interaction.values[0];
      const result = await openTicket(interaction.guild, interaction.user, category);

      if (result.error) {
        return interaction.editReply({ content: result.error });
      }

      return interaction.editReply({
        content: `Your ticket has been created: <#${result.channel.id}>`
      });
    }

    // ── Button: close ticket ─────────────────────────────────────────────────
    if (interaction.isButton() && interaction.customId === 'ticket_close') {
      await interaction.deferReply({ ephemeral: true });

      const ticketData = db.getTicket(interaction.channel.id);
      if (!ticketData) {
        return interaction.editReply({ content: 'This does not appear to be a valid ticket channel.' });
      }

      // Only the ticket owner or staff/immunity roles can close
      const guildData = db.getGuild(interaction.guild.id);
      const member = interaction.member;

      const isOwner = interaction.user.id === ticketData.userId;
      const staffRoleId = guildData.staffRoles[ticketData.category];
      const isStaff = staffRoleId && member.roles.cache.has(staffRoleId);
      const isImmune = (guildData.immunityRoles || []).some(rid => member.roles.cache.has(rid));
      const isAdmin = member.permissions.has('Administrator');

      if (!isOwner && !isStaff && !isImmune && !isAdmin) {
        return interaction.editReply({ content: 'You do not have permission to close this ticket.' });
      }

      await interaction.editReply({ content: 'Saving transcript and closing ticket...' });

      // Save transcript
      const transcriptChannel = await saveTranscript(
        interaction.guild,
        interaction.channel,
        interaction.user
      );

      // Set cooldown on the ticket opener
      db.setUserCooldown(interaction.guild.id, ticketData.userId);
      db.deleteTicketRecord(interaction.channel.id);

      // Notify in ticket before deletion
      const embed = new EmbedBuilder()
        .setDescription(
          `This ticket has been closed by **${interaction.user.tag}**.\n` +
          (transcriptChannel ? `Transcript saved in <#${transcriptChannel.id}>.` : '')
        )
        .setColor(0xD90000)
        .setFooter({ text: 'Ranked Tickets' })
        .setTimestamp();

      await interaction.channel.send({ embeds: [embed] }).catch(() => {});

      // Delete the ticket channel after a short delay
      setTimeout(() => {
        interaction.channel.delete().catch(err => {
          console.error('[close] Failed to delete ticket channel:', err);
        });
      }, 3000);

      return;
    }

    // ── Button: save transcript (manual) ────────────────────────────────────
    if (interaction.isButton() && interaction.customId === 'ticket_transcript') {
      await interaction.deferReply({ ephemeral: true });

      const ticketData = db.getTicket(interaction.channel.id);
      if (!ticketData) {
        return interaction.editReply({ content: 'This does not appear to be a valid ticket channel.' });
      }

      const guildData = db.getGuild(interaction.guild.id);
      const member = interaction.member;

      const staffRoleId = guildData.staffRoles[ticketData.category];
      const isStaff = staffRoleId && member.roles.cache.has(staffRoleId);
      const isImmune = (guildData.immunityRoles || []).some(rid => member.roles.cache.has(rid));
      const isAdmin = member.permissions.has('Administrator');

      if (!isStaff && !isImmune && !isAdmin) {
        return interaction.editReply({
          content: 'Only staff members can manually save a transcript.'
        });
      }

      const transcriptChannel = await saveTranscript(
        interaction.guild,
        interaction.channel,
        interaction.user
      );

      if (!transcriptChannel) {
        return interaction.editReply({
          content: 'Failed to save transcript. Ensure the transcript category is set up correctly.'
        });
      }

      return interaction.editReply({
        content: `Transcript saved in <#${transcriptChannel.id}>.`
      });
    }
  }
};
