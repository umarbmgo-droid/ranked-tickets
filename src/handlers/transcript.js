const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const db = require('./db');
const { CATEGORY_LABELS } = require('./ticket');

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTimestamp(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function avatarUrl(user) {
  return user.displayAvatarURL({ extension: 'png', size: 64 }) ||
    `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator) % 5}.png`;
}

function buildHtml(ticketId, category, openedBy, closedBy, closedAt, messages) {
  const categoryColors = {
    Hacks: '#ed4245',
    Alts: '#faa61a',
    Queues: '#57f287',
    General: '#5865f2',
    Unknown: '#aaaaaa'
  };
  const catColor = categoryColors[category] || '#aaaaaa';

  const messageRows = messages.map(msg => {
    const avatar = avatarUrl(msg.author);
    const isBot = msg.author.bot;
    const name = escapeHtml(msg.author.username);
    const time = formatTimestamp(msg.createdTimestamp);

    let contentHtml = '';

    if (msg.content) {
      contentHtml += `<div class="msg-content">${escapeHtml(msg.content)}</div>`;
    }

    for (const embed of msg.embeds) {
      const color = embed.color ? `#${embed.color.toString(16).padStart(6, '0')}` : '#2b2d31';
      let embedInner = '';
      if (embed.title) embedInner += `<div class="embed-title">${escapeHtml(embed.title)}</div>`;
      if (embed.description) embedInner += `<div class="embed-desc">${escapeHtml(embed.description)}</div>`;
      if (embed.fields && embed.fields.length) {
        embedInner += `<div class="embed-fields">`;
        for (const f of embed.fields) {
          embedInner += `<div class="embed-field ${f.inline ? 'inline' : ''}">
            <div class="field-name">${escapeHtml(f.name)}</div>
            <div class="field-value">${escapeHtml(f.value)}</div>
          </div>`;
        }
        embedInner += `</div>`;
      }
      if (embed.footer) embedInner += `<div class="embed-footer">${escapeHtml(embed.footer.text)}</div>`;
      contentHtml += `<div class="embed" style="border-left-color:${color}">${embedInner}</div>`;
    }

    for (const att of msg.attachments.values()) {
      const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(att.name || '');
      if (isImage) {
        contentHtml += `<div class="attachment"><img src="${escapeHtml(att.url)}" alt="${escapeHtml(att.name)}" /></div>`;
      } else {
        contentHtml += `<div class="attachment file"><a href="${escapeHtml(att.url)}" target="_blank">${escapeHtml(att.name || 'Attachment')}</a></div>`;
      }
    }

    if (!contentHtml) contentHtml = `<div class="msg-content muted">[no content]</div>`;

    return `
    <div class="message ${isBot ? 'bot' : ''}">
      <img class="avatar" src="${avatar}" alt="${name}" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'" />
      <div class="message-body">
        <div class="message-header">
          <span class="username ${isBot ? 'bot-tag' : ''}">${name}${isBot ? ' <span class="badge">BOT</span>' : ''}</span>
          <span class="timestamp">${time}</span>
        </div>
        ${contentHtml}
      </div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Transcript — ${escapeHtml(ticketId)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #313338; color: #dbdee1; font-family: 'gg sans', 'Noto Sans', Whitney, sans-serif; font-size: 15px; line-height: 1.5; }
  a { color: #00b0f4; text-decoration: none; }
  a:hover { text-decoration: underline; }

  .header {
    background: #1e1f22;
    border-bottom: 1px solid #1a1b1e;
    padding: 20px 32px;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .header-icon {
    width: 48px; height: 48px;
    background: ${catColor};
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; font-weight: 700; color: #fff; flex-shrink: 0;
  }
  .header-info h1 { font-size: 18px; font-weight: 700; color: #f2f3f5; }
  .header-info p { font-size: 13px; color: #949ba4; margin-top: 2px; }

  .meta-bar {
    background: #2b2d31;
    border-bottom: 1px solid #1e1f22;
    padding: 12px 32px;
    display: flex; gap: 32px; flex-wrap: wrap;
  }
  .meta-item { display: flex; flex-direction: column; gap: 2px; }
  .meta-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #949ba4; }
  .meta-value { font-size: 13px; color: #dbdee1; }
  .cat-badge {
    display: inline-block; padding: 1px 8px; border-radius: 4px;
    background: ${catColor}22; color: ${catColor};
    font-size: 12px; font-weight: 600;
  }

  .messages { padding: 16px 32px; max-width: 900px; margin: 0 auto; }

  .message {
    display: flex; gap: 16px;
    padding: 4px 0 4px 0;
    margin-bottom: 4px;
    border-radius: 4px;
    transition: background .1s;
  }
  .message:hover { background: #2e3035; }
  .message.bot { opacity: .9; }

  .avatar {
    width: 40px; height: 40px; border-radius: 50%;
    flex-shrink: 0; margin-top: 2px;
    background: #5865f2;
  }

  .message-body { flex: 1; min-width: 0; }
  .message-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 2px; }
  .username { font-weight: 600; color: #f2f3f5; font-size: 15px; }
  .username.bot-tag { color: #5865f2; }
  .badge {
    font-size: 9px; font-weight: 700; background: #5865f2; color: #fff;
    padding: 1px 5px; border-radius: 3px; vertical-align: middle;
    text-transform: uppercase; letter-spacing: .3px;
  }
  .timestamp { font-size: 11px; color: #949ba4; }

  .msg-content { color: #dbdee1; word-break: break-word; white-space: pre-wrap; }
  .msg-content.muted { color: #4e5058; font-style: italic; }

  .embed {
    margin-top: 4px;
    background: #2b2d31;
    border-left: 4px solid #1e1f22;
    border-radius: 0 4px 4px 0;
    padding: 10px 14px;
    max-width: 520px;
  }
  .embed-title { font-weight: 700; color: #f2f3f5; margin-bottom: 6px; font-size: 14px; }
  .embed-desc { color: #dbdee1; font-size: 13px; white-space: pre-wrap; word-break: break-word; margin-bottom: 8px; }
  .embed-fields { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
  .embed-field { min-width: 120px; flex: 1; }
  .embed-field.inline { flex: 0 1 auto; }
  .field-name { font-size: 12px; font-weight: 700; color: #f2f3f5; margin-bottom: 2px; text-transform: uppercase; letter-spacing: .3px; }
  .field-value { font-size: 13px; color: #dbdee1; }
  .embed-footer { font-size: 11px; color: #949ba4; margin-top: 8px; }

  .attachment { margin-top: 6px; }
  .attachment img { max-width: 400px; max-height: 300px; border-radius: 4px; display: block; }
  .attachment.file { background: #2b2d31; border-radius: 4px; padding: 8px 12px; font-size: 13px; display: inline-block; }

  .day-divider {
    display: flex; align-items: center; gap: 12px;
    margin: 20px 0 12px; color: #949ba4; font-size: 12px; font-weight: 600;
  }
  .day-divider::before, .day-divider::after {
    content: ''; flex: 1; height: 1px; background: #3f4147;
  }

  .footer-bar {
    text-align: center; padding: 24px; color: #4e5058; font-size: 12px;
    border-top: 1px solid #1e1f22; margin-top: 24px;
  }
</style>
</head>
<body>

<div class="header">
  <div class="header-icon">${category.charAt(0)}</div>
  <div class="header-info">
    <h1>Ticket ${escapeHtml(ticketId)}</h1>
    <p>Ranked Tickets — Support Transcript</p>
  </div>
</div>

<div class="meta-bar">
  <div class="meta-item">
    <span class="meta-label">Ticket ID</span>
    <span class="meta-value">${escapeHtml(ticketId)}</span>
  </div>
  <div class="meta-item">
    <span class="meta-label">Category</span>
    <span class="meta-value"><span class="cat-badge">${escapeHtml(category)}</span></span>
  </div>
  <div class="meta-item">
    <span class="meta-label">Opened by</span>
    <span class="meta-value">${escapeHtml(openedBy)}</span>
  </div>
  <div class="meta-item">
    <span class="meta-label">Closed by</span>
    <span class="meta-value">${escapeHtml(closedBy)}</span>
  </div>
  <div class="meta-item">
    <span class="meta-label">Closed at</span>
    <span class="meta-value">${escapeHtml(closedAt)}</span>
  </div>
  <div class="meta-item">
    <span class="meta-label">Messages</span>
    <span class="meta-value">${messages.length}</span>
  </div>
</div>

<div class="messages">
  <div class="day-divider">Start of Ticket</div>
  ${messageRows}
  <div class="day-divider">End of Ticket</div>
</div>

<div class="footer-bar">
  Generated by Ranked Tickets &bull; ${escapeHtml(closedAt)}
</div>

</body>
</html>`;
}

async function saveTranscript(guild, ticketChannel, closedBy) {
  const guildData = db.getGuild(guild.id);
  const ticketData = db.getTicket(ticketChannel.id);

  if (!guildData.transcriptChannelId) return null;

  const transcriptChannel = guild.channels.cache.get(guildData.transcriptChannelId);
  if (!transcriptChannel) return null;

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

  const pad = (n) => String(n).padStart(4, '0');
  const ticketId = ticketData ? `#${pad(ticketData.ticketNum)}` : ticketChannel.name;
  const category = ticketData ? (CATEGORY_LABELS[ticketData.category] || ticketData.category) : 'Unknown';
  const closedAt = new Date().toUTCString();

  // Fetch opener user tag
  let openedByTag = 'Unknown';
  if (ticketData?.userId) {
    const opener = await guild.members.fetch(ticketData.userId).catch(() => null);
    openedByTag = opener ? opener.user.tag : `<@${ticketData.userId}>`;
  }

  const html = buildHtml(ticketId, category, openedByTag, closedBy.tag, closedAt, messages);
  const buffer = Buffer.from(html, 'utf-8');
  const attachment = new AttachmentBuilder(buffer, {
    name: `transcript-${ticketChannel.name}.html`
  });

  const embed = new EmbedBuilder()
    .setTitle(`Transcript — ${ticketChannel.name}`)
    .addFields(
      { name: 'Ticket ID', value: ticketId, inline: true },
      { name: 'Category', value: category, inline: true },
      { name: 'Closed by', value: closedBy.tag, inline: true },
      { name: 'Messages', value: String(messages.length), inline: true },
      { name: 'Opened by', value: openedByTag, inline: true }
    )
    .setColor(0x2b2d31)
    .setFooter({ text: 'Ranked Tickets — Open the .html file in your browser to view.' })
    .setTimestamp();

  await transcriptChannel.send({ embeds: [embed], files: [attachment] }).catch(err => {
    console.error('[transcript] Failed to post transcript:', err);
  });

  return transcriptChannel;
}

module.exports = { saveTranscript };
