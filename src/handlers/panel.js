const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

function buildPanel() {
  const embed = new EmbedBuilder()
    .setTitle('Ranked Support')
    .setDescription(
      'Select a category below that matches your reason for opening a ticket.\n\n' +
      '**HACKS** — For hack-related reports and accusations only.\n\n' +
      '**ALTS** — For suspected alternate account reports only.\n\n' +
      '**QUEUES** — For queue-related issues only. This includes ELO adjustments, sabotage reports, queue reverts, and similar.\n\n' +
      '**GENERAL** — For anything else that does not fall under the above categories.'
    )
    .setColor(0xD90000)
    .setFooter({ text: 'Ranked Tickets — Open a ticket to receive support.' })
    .setTimestamp();

  const menu = new StringSelectMenuBuilder()
    .setCustomId('ticket_open')
    .setPlaceholder('Select a support category...')
    .addOptions([
      {
        label: 'Hacks',
        description: 'Report a player for hacking or file an accusation.',
        value: 'hacks'
      },
      {
        label: 'Alts',
        description: 'Report a suspected alternate account.',
        value: 'alts'
      },
      {
        label: 'Queues',
        description: 'ELO adjustments, sabotage reports, queue reverts, and more.',
        value: 'queues'
      },
      {
        label: 'General',
        description: 'General ranked support — anything that does not fit above.',
        value: 'general'
      }
    ]);

  const row = new ActionRowBuilder().addComponents(menu);
  return { embeds: [embed], components: [row] };
}

module.exports = { buildPanel };
