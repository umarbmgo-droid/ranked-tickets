const { Events, ActivityType } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,

  execute(client) {
    console.log(`[Ranked Tickets] Logged in as ${client.user.tag}`);
    console.log(`[Ranked Tickets] Serving ${client.guilds.cache.size} guild(s)`);

    client.user.setPresence({
      activities: [
        {
          name: 'Handling Tickets',
          type: ActivityType.Streaming,
          url: 'https://www.twitch.tv/placeholder'
        }
      ],
      status: 'online'
    });
  }
};
