const {
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} = require('discord.js');
const db = require('./db');

const CATEGORY_LABELS = {
  hacks: 'Hacks',
  alts: 'Alts',
  queues: 'Queues',
  general: 'General'
};

const CATEGORY_INSTRUCTIONS = {
  hacks:
    'Provide the in-game username of the player you are reporting, video or screenshot proof, and any additional context you consider relevant.',
  alts:
    'Provide the usernames of the suspected alternate account(s) and any supporting evidence you have.',
  queues:
    'Describe your queue issue in full detail. Include the queue name, what occurred, and the resolution you are requesting (e.g. ELO revert, sabotage report, etc.).',
  general:
    'Describe your issue in as much detail as possible. A member of staff will review your ticket shortly.'
};

async function openTicket(guild, user, category) {
  const guildData = db.getGuild(guild.id);

  // ── Spam / cooldown check ────────────────────────────────────────────────
  const check = db.checkUserAllowed(guild.id, user.id);

  if (!check.allowed) {
    if (check.reason === 'active') {
      const ch = guild.channels.cache.get(check.channelId);
      const mention = ch ? `<#${ch.id}>` : 'your existing ticket';
      return {
        error: `You already have an open ticket: ${mention}. Please resolve it before opening a new one.`
      };
    }
    if (check.reason === 'cooldown') {
      const remaining = Math.ceil((check.cooldownUntil - Date.now()) / 60000);
      return {
        error: `You are on a cooldown. You may open another ticket in **${remaining} minute${remaining === 1 ? '' : 's'}**.`
      };
    }
  }

  // ── Category exists check ────────────────────────────────────────────────
  const categoryChannelId = guildData.categories[category];
  if (!categoryChannelId) {
    return {
      error: `The **${CATEGORY_LABELS[category]}** category has not been configured. Please contact an administrator.`
    };
  }

  const categoryChannel = guild.channels.cache.get(categoryChannelId);
  if (!categoryChannel) {
    return {
      error: 'The ticket category could not be found. Please contact an administrator.'
    };
  }

  // ── Build permission overwrites ──────────────────────────────────────────
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    {
      id: user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks
      ]
    }
  ];

  // Staff role for this category
  const staffRoleId = guildData.staffRoles[category];
  if (staffRoleId) {
    overwrites.push({
      id: staffRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ManageMessages
      ]
    });
  }

  // Immunity roles
  for (const roleId of guildData.immunityRoles || []) {
    overwrites.push({
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ManageMessages
      ]
    });
  }

  // ── Create ticket number and channel ────────────────────────────────────
  const ticketNum = db.nextTicketNumber(guild.id);
  const channelName = `${category}-${String(ticketNum).padStart(4, '0')}`;

  let ticketChannel;
  try {
    ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: categoryChannelId,
      permissionOverwrites: overwrites,
      topic: `Ticket #${String(ticketNum).padStart(4, '0')} | ${CATEGORY_LABELS[category]} | ${user.tag}`
    });
  } catch (err) {
    console.error('[openTicket] Channel creation failed:', err);
    return {
      error: 'Failed to create your ticket channel. Please ensure the bot has Manage Channels permission.'
    };
  }

  // ── Persist state ────────────────────────────────────────────────────────
  db.createTicketRecord({
    channelId: ticketChannel.id,
    guildId: guild.id,
    userId: user.id,
    category,
    ticketNum,
    status: 'open',
    createdAt: Date.now()
  });

  db.setUserActive(guild.id, user.id, ticketChannel.id);

  // ── Send ticket embed ────────────────────────────────────────────────────
  const embed = new EmbedBuilder()
    .setTitle(`${CATEGORY_LABELS[category]} — Ticket #${String(ticketNum).padStart(4, '0')}`)
    .setDescription(
      `Welcome, ${user}. A member of staff will be with you shortly.\n\n` +
      `**What to include:**\n${CATEGORY_INSTRUCTIONS[category]}`
    )
    .addFields(
      { name: 'Opened by', value: `${user.tag}`, inline: true },
      { name: 'Category', value: CATEGORY_LABELS[category], inline: true },
      { name: 'Ticket ID', value: `#${String(ticketNum).padStart(4, '0')}`, inline: true }
    )
    .setColor(0xD90000)
    .setFooter({ text: 'Ranked Tickets' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('ticket_transcript')
      .setLabel('Save Transcript')
      .setStyle(ButtonStyle.Secondary)
  );

  await ticketChannel.send({
    content: `${user}`,
    embeds: [embed],
    components: [row]
  });

  return { channel: ticketChannel };
}

module.exports = { openTicket, CATEGORY_LABELS };
