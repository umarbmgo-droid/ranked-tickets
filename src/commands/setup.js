const {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder
} = require('discord.js');
const db = require('../handlers/db');
const { buildPanel } = require('../handlers/panel');

const OWNER_ID = '253335267618848778';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Initialize Ranked Tickets in this server. Owner only.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({
        content: 'You do not have permission to run this command.',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const guildData = db.getGuild(guild.id);

    if (guildData.panelChannelId && guild.channels.cache.has(guildData.panelChannelId)) {
      return interaction.editReply({
        content: 'This server is already set up. To redo the setup, delete the existing Ranked Tickets channels and categories first, then run `/setup` again.'
      });
    }

    try {
      // ── Ticket categories ──────────────────────────────────────────────
      const hacksCategory = await guild.channels.create({
        name: 'Hacks Tickets',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }
        ]
      });

      const altsCategory = await guild.channels.create({
        name: 'Alts Tickets',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }
        ]
      });

      const queuesCategory = await guild.channels.create({
        name: 'Queues Tickets',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }
        ]
      });

      const generalCategory = await guild.channels.create({
        name: 'General Tickets',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }
        ]
      });

      // ── Staff category with transcripts channel ────────────────────────
      const staffCategory = await guild.channels.create({
        name: 'Staff',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }
        ]
      });

      const transcriptChannel = await guild.channels.create({
        name: 'transcripts',
        type: ChannelType.GuildText,
        parent: staffCategory.id,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }
        ]
      });

      // ── Panel channel ──────────────────────────────────────────────────
      const panelChannel = await guild.channels.create({
        name: 'ranked-support',
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            deny: [PermissionFlagsBits.SendMessages]
          }
        ]
      });

      await panelChannel.send(buildPanel());

      // ── Save to DB ─────────────────────────────────────────────────────
      db.setGuild(guild.id, {
        panelChannelId: panelChannel.id,
        transcriptChannelId: transcriptChannel.id,
        categories: {
          hacks: hacksCategory.id,
          alts: altsCategory.id,
          queues: queuesCategory.id,
          general: generalCategory.id
        }
      });

      const embed = new EmbedBuilder()
        .setTitle('Setup Complete')
        .setDescription('Ranked Tickets has been successfully initialized.')
        .addFields(
          { name: 'Panel Channel', value: `<#${panelChannel.id}>`, inline: true },
          { name: 'Transcripts', value: `<#${transcriptChannel.id}>`, inline: true },
          {
            name: 'Ticket Categories',
            value: [
              `Hacks: ${hacksCategory.name}`,
              `Alts: ${altsCategory.name}`,
              `Queues: ${queuesCategory.name}`,
              `General: ${generalCategory.name}`
            ].join('\n')
          }
        )
        .setColor(0xD90000)
        .setFooter({ text: 'Ranked Tickets' })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[setup] Error during setup:', err);
      return interaction.editReply({
        content: 'An error occurred during setup. Please ensure the bot has Administrator permissions and try again.'
      });
    }
  }
};
