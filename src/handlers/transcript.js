const {
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
  AttachmentBuilder
} = require('discord.js');
const db = require('./db');
const { CATEGORY_LABELS } = require('./ticket');

async function saveTranscript(guild, ticketChannel, closedBy) {
  const guildData = db.getGuild(guild.id);
  const ticketData = db.getTicket(ticketChannel.id);

  if (!guildData.transcriptCategoryId) return null;

  const transcriptCategory = guild.channels.cache.get(guildData.transcriptCategoryId);
  if (!transcriptCategory) return null;

  // ── Fetch all messages ───────────────────────────────────────────────────
  let messages = [];
  let lastId;

  while (true) {
    const options = { limit: 100 };
    if (lastId) options.before = lastId;
    const batch = await ticketChannel.messages.fetch(options).catch(() => null);
    if (!batch || batch.size === 0) break;
    messages = messages.concat([...batch.values()]);
    lastId = batch.last().id;
    if (batch.size < 100) break;
  }

  messages.reverse();

  // ── Build transcript text ────────────────────────────────────────────────
  const pad = (n) => String(n).padStart(4, '0');
  const ticketId = ticketData ? `#${pad(ticketData.ticketNum)}` : ticketChannel.name;
  const category = ticketData ? (CATEGORY_LABELS[ticketData.category] || ticketData.category) : 'Unknown';

  const header = [
    '═══════════════════════════════════════════════════',
    '  RANKED TICKETS — TRANSCRIPT',
    '═══════════════════════════════════════════════════',
    `  Ticket ID : ${ticketId}`,
    `  Category  : ${category}`,
    `  Opened by : ${ticketData?.userId ? `<@${ticketData.userId}>` : 'Unknown'}`,
    `  Closed by : ${closedBy.tag} (${closedBy.id})`,
    `  Date      : ${new Date().toUTCString()}`,
    `  Messages  : ${messages.length}`,
    '═══════════════════════════════════════════════════',
    ''
  ].join('\n');

  const lines = [header];

  for (const msg of messages) {
    const time = new Date(msg.createdTimestamp).toUTCString();
    const author = `${msg.author.tag} (${msg.author.id})`;
    const content = msg.content || '';
    const embeds = msg.embeds.map(e => `[Embed: ${e.title || 'untitled'}]`).join(' ');
    const attachments = [...msg.attachments.values()].map(a => `[Attachment: ${a.url}]`).join(' ');

    const parts = [content, embeds, attachments].filter(Boolean).join(' ');
    lines.push(`[${time}] ${author}: ${parts || '[no content]'}`);
  }

  const buffer = Buffer.from(lines.join('\n'), 'utf-8');
  const attachment = new AttachmentBuilder(buffer, {
    name: `transcript-${ticketChannel.name}.txt`
  });

  // ── Create transcript channel ────────────────────────────────────────────
  let transcriptChannel;
  try {
    transcriptChannel = await guild.channels.create({
      name: `t-${ticketChannel.name}`,
      type: ChannelType.GuildText,
      parent: guildData.transcriptCategoryId,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }
      ]
    });
  } catch (err) {
    console.error('[transcript] Failed to create transcript channel:', err);
    return null;
  }

  // Add immunity roles to transcript channel
  for (const roleId of guildData.immunityRoles || []) {
    await transcriptChannel.permissionOverwrites.create(roleId, {
      ViewChannel: true,
      ReadMessageHistory: true
    }).catch(() => {});
  }

  const embed = new EmbedBuilder()
    .setTitle(`Transcript — ${ticketChannel.name}`)
    .addFields(
      { name: 'Ticket ID', value: ticketId, inline: true },
      { name: 'Category', value: category, inline: true },
      { name: 'Closed by', value: `${closedBy.tag}`, inline: true },
      { name: 'Messages', value: String(messages.length), inline: true },
      { name: 'Opened by', value: ticketData ? `<@${ticketData.userId}>` : 'Unknown', inline: true }
    )
    .setColor(0x2b2d31)
    .setFooter({ text: 'Ranked Tickets' })
    .setTimestamp();

  await transcriptChannel.send({ embeds: [embed], files: [attachment] });

  return transcriptChannel;
}

module.exports = { saveTranscript };
