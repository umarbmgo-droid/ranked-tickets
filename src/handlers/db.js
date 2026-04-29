const fs = require('fs-extra');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/db.json');
const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

const DEFAULT = {
  guilds: {},
  tickets: {},
  ticketCounter: {},
  userStates: {}
};

function load() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.ensureDirSync(path.dirname(DB_PATH));
      fs.writeJsonSync(DB_PATH, DEFAULT, { spaces: 2 });
    }
    return fs.readJsonSync(DB_PATH);
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT));
  }
}

function save(db) {
  fs.ensureDirSync(path.dirname(DB_PATH));
  fs.writeJsonSync(DB_PATH, db, { spaces: 2 });
}

// ── Guild ─────────────────────────────────────────────────────────────────────

function getGuild(guildId) {
  const db = load();
  if (!db.guilds[guildId]) {
    db.guilds[guildId] = {
      panelChannelId: null,
      transcriptCategoryId: null,
      categories: { hacks: null, alts: null, queues: null, general: null },
      staffRoles: {},
      immunityRoles: []
    };
    save(db);
  }
  return db.guilds[guildId];
}

function setGuild(guildId, data) {
  const db = load();
  db.guilds[guildId] = { ...getGuild(guildId), ...data };
  save(db);
}

// ── Ticket counter ────────────────────────────────────────────────────────────

function nextTicketNumber(guildId) {
  const db = load();
  if (!db.ticketCounter[guildId]) db.ticketCounter[guildId] = 0;
  db.ticketCounter[guildId]++;
  save(db);
  return db.ticketCounter[guildId];
}

// ── Ticket records ────────────────────────────────────────────────────────────

function createTicketRecord(data) {
  const db = load();
  db.tickets[data.channelId] = data;
  save(db);
}

function getTicket(channelId) {
  const db = load();
  return db.tickets[channelId] || null;
}

function deleteTicketRecord(channelId) {
  const db = load();
  delete db.tickets[channelId];
  save(db);
}

// ── User state: active ticket + cooldown ──────────────────────────────────────

function _key(guildId, userId) {
  return `${guildId}:${userId}`;
}

function getUserState(guildId, userId) {
  const db = load();
  return db.userStates[_key(guildId, userId)] || { activeChannelId: null, cooldownUntil: null };
}

function setUserActive(guildId, userId, channelId) {
  const db = load();
  db.userStates[_key(guildId, userId)] = { activeChannelId: channelId, cooldownUntil: null };
  save(db);
}

function setUserCooldown(guildId, userId) {
  const db = load();
  db.userStates[_key(guildId, userId)] = {
    activeChannelId: null,
    cooldownUntil: Date.now() + COOLDOWN_MS
  };
  save(db);
}

function clearUserState(guildId, userId) {
  const db = load();
  db.userStates[_key(guildId, userId)] = { activeChannelId: null, cooldownUntil: null };
  save(db);
}

/**
 * Returns: { allowed: true }
 *       or { allowed: false, reason: 'active', channelId }
 *       or { allowed: false, reason: 'cooldown', cooldownUntil }
 */
function checkUserAllowed(guildId, userId) {
  const state = getUserState(guildId, userId);

  if (state.activeChannelId) {
    return { allowed: false, reason: 'active', channelId: state.activeChannelId };
  }

  if (state.cooldownUntil && Date.now() < state.cooldownUntil) {
    return { allowed: false, reason: 'cooldown', cooldownUntil: state.cooldownUntil };
  }

  return { allowed: true };
}

module.exports = {
  getGuild,
  setGuild,
  nextTicketNumber,
  createTicketRecord,
  getTicket,
  deleteTicketRecord,
  getUserState,
  setUserActive,
  setUserCooldown,
  clearUserState,
  checkUserAllowed,
  COOLDOWN_MS
};
