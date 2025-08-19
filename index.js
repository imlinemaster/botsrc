const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const express = require('express');
const app = express();

let vanity = "/bills";           
const token = process.env.TOKEN;  
const role_id = "1405664498706288680";   
const guild_id = "1405304492202922004"; 

const whitelist_roles = [
  "1405304492374888634",
  "1405304492374888633",
  "1405304492374888632",
  "1405304492374888631",
  "1405304492374888630",
  "1405304492374888629",
  "1405304492349718708",
  "1405304492349718707",
  "1405318902774497432"
];

const cooldown_ms = 30000;
const cooldowns = new Map();

// keep-alive webserver
app.get('/', (req, res) => res.send('bot is alive!'));
app.listen(3000, () => console.log('express server running on port 3000'));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

async function update_all_roles() {
  const guild = client.guilds.cache.get(guild_id);
  if (!guild) return;

  await guild.members.fetch(); 
  const role = guild.roles.cache.get(role_id);
  if (!role) return;

  guild.members.cache.forEach(async (member) => {
    let has_vanity = false;
    for (const activity of member.presence?.activities || []) {
      if (activity.type === ActivityType.Custom && activity.state && activity.state.toLowerCase().includes(vanity.toLowerCase())) {
        has_vanity = true;
        break;
      }
    }

    try {
      if (has_vanity && !member.roles.cache.has(role.id)) {
        await member.roles.add(role, 'has vanity in status');
      } else if (!has_vanity && member.roles.cache.has(role.id)) {
        await member.roles.remove(role, 'vanity removed');
      }
    } catch (err) {}
  });
}

client.once('ready', async () => {
  console.log(`logged in as ${client.user.tag}`);
  await update_all_roles();

  client.user.setPresence({
    activities: [{
      name: vanity.toLowerCase(),
      type: ActivityType.Streaming,
      url: 'https://twitch.tv/caidenwtf'
    }],
    status: 'online'
  });
});

client.on('presenceUpdate', async (oldPresence, newPresence) => {
  const guild = client.guilds.cache.get(guild_id);
  if (!guild) return;

  const member = guild.members.cache.get(newPresence.userId);
  if (!member) return;

  const role = guild.roles.cache.get(role_id);
  if (!role) return;

  let custom_status = null;
  for (const activity of newPresence.activities) {
    if (activity.type === ActivityType.Custom) {
      custom_status = activity.state;
      break;
    }
  }

  try {
    if (custom_status && custom_status.toLowerCase().includes(vanity.toLowerCase())) {
      if (!member.roles.cache.has(role.id)) {
        await member.roles.add(role, 'has vanity in status');
      }
    } else {
      if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role, 'vanity removed');
      }
    }
  } catch (err) {}
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.member.roles.cache.some(role => whitelist_roles.includes(role.id))) return;

  const last_time = cooldowns.get(message.author.id) || 0;
  if (Date.now() - last_time < cooldown_ms) return;
  cooldowns.set(message.author.id, Date.now());

  const content = message.content.toLowerCase();
  const triggers = [
    "pic perms",
    "photo perms",
    "image perms",
    "send pics",
    "send photos",
    "send images",
    "cannot send pics",
    "can't send pics",
    "cant send pics",
    "how do i get pic perms",
    "how to get pics",
    "how to send pics"
  ];

  if (triggers.some(trigger => content.includes(trigger))) {
    await message.reply(`rep ${vanity.toLowerCase()} or boost for pic perms`);
  }
});

client.login(token);

async function change_vanity(new_vanity) {
  vanity = new_vanity;
  await update_all_roles();
  client.user.setPresence({
    activities: [{
      name: vanity.toLowerCase(),
      type: ActivityType.Streaming,
      url: 'https://twitch.tv/caidenwtf'
    }],
    status: 'online'
  });
  console.log(`vanity changed to ${vanity.toLowerCase()} and roles updated!`);
}
