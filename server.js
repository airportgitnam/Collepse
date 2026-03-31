// server.js (Refactored with MongoDB + Clean Architecture)
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Telegraf, Markup } = require('telegraf');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const bot = new Telegraf(process.env.BOT_TOKEN);


// ================== MIDDLEWARE ==================
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));


// ================== DATABASE ==================
mongoose.connect('mongodb://localhost:27017/collepse', {
}).then(() => console.log('✅ MongoDB подключен'))
  .catch(err => console.error('❌ MongoDB ошибка:', err));

// ================== SCHEMA ==================
const applicationSchema = new mongoose.Schema({
  name: String,
  phone: String,
  telegram: String,
  message: String,
  date: { type: Date, default: Date.now },
  status: { type: String, default: 'pending' },
  ip: String
});

const Application = mongoose.model('Application', applicationSchema);

const userFlagSchema = new mongoose.Schema({
  username: { type: String, required: true, lowercase: true, trim: true },
  type: { type: String, enum: ['blocked', 'blacklisted'], required: true },
  reason: { type: String, default: '' },
  date: { type: Date, default: Date.now }
});

const UserFlag = mongoose.model('UserFlag', userFlagSchema);

const ADMIN_ID = process.env.ADMIN_ID;

const isAdmin = (ctx) => ctx.from && ctx.from.id.toString() === ADMIN_ID;

const formatFlagMessage = (items, type) => {
  if (!items.length) return `Нет ${type}`;
  return items.map((item, index) => `${index + 1}. @${item.username} ${item.reason ? `- ${item.reason}` : ''}`).join('\n');
};

// Получаем инфу о боте
(async () => {
  await bot.launch();
  bot.botInfo = await bot.telegram.getMe();
  console.log(`🤖 Бот запущен: @${bot.botInfo.username}`);
})();

// ================== HELPERS ==================
const getStatusEmoji = (status) => ({
  pending: '🟡',
  in_progress: '🟠',
  completed: '✅',
  cancelled: '❌'
}[status] || '⚪');

const getStatusText = (status) => ({
  pending: 'Ожидает',
  in_progress: 'В работе',
  completed: 'Выполнено',
  cancelled: 'Отменено'
}[status] || 'Неизвестно');

// ================== BOT COMMANDS ==================
bot.start(async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('⛔ Нет доступа');

  const total = await Application.countDocuments();
  const blocked = await UserFlag.countDocuments({ type: 'blocked' });
  const blacklisted = await UserFlag.countDocuments({ type: 'blacklisted' });

  ctx.reply(
    `🤖 Система активна\n📊 Всего заявок: ${total}\n🛑 Заблокировано: ${blocked}\n🚫 В ЧС: ${blacklisted}`,
    Markup.inlineKeyboard([
      [Markup.button.callback('📊 Статистика', 'stats'), Markup.button.callback('📋 Заявки', 'apps')],
      [Markup.button.callback('🛑 Списки', 'flags'), Markup.button.callback('✉ Быстрые ответы', 'templates')]
    ])
  );
});

// ================== STATS ==================
bot.action('stats', async (ctx) => {
  await ctx.answerCbQuery();

  const total = await Application.countDocuments();
  const completed = await Application.countDocuments({ status: 'completed' });

  ctx.reply(`📊 Всего: ${total}\n✅ Выполнено: ${completed}`);
});

// ================== LIST ==================
bot.action('apps', async (ctx) => {
  await ctx.answerCbQuery();

  const apps = await Application.find().sort({ date: -1 }).limit(5);

  if (!apps.length) return ctx.reply('Нет заявок');

  let msg = '📋 Последние заявки:\n\n';
  apps.forEach((a, i) => {
    msg += `${i + 1}. ${a.name} (${a.phone})\n`;
    if (a.telegram) msg += `@${a.telegram}\n`;
    msg += `${getStatusEmoji(a.status)} ${getStatusText(a.status)}\n\n`;
  });

  const buttons = apps.flatMap((a) => {
    const rows = [];
    if (a.telegram) {
      rows.push([
        Markup.button.url('📩 Написать', `https://t.me/${a.telegram}`),
        Markup.button.callback('🧠 Управлять', `manage:${a.telegram}`)
      ]);
    }
    rows.push([
      Markup.button.callback('✅ Выполнено', `done_${a._id}`),
      Markup.button.callback('❌ Отмена', `cancel_${a._id}`)
    ]);
    if (a.telegram) {
      rows.push([Markup.button.callback('⬆️ Быстрый шаблон', `write_tpl:${a.telegram}`)]);
    }
    return rows;
  });

  ctx.reply(msg, Markup.inlineKeyboard(buttons));
});

bot.action('flags', async (ctx) => {
  await ctx.answerCbQuery();

  const blocked = await UserFlag.find({ type: 'blocked' }).sort({ date: -1 }).limit(10);
  const blacklisted = await UserFlag.find({ type: 'blacklisted' }).sort({ date: -1 }).limit(10);

  const flagButtons = [];
  blocked.forEach((item) => {
    flagButtons.push([
      Markup.button.callback(`🟠 Разблокировать @${item.username}`, `unblock_user:${item.username}`)
    ]);
  });
  blacklisted.forEach((item) => {
    flagButtons.push([
      Markup.button.callback(`⚠️ Убрать из ЧС @${item.username}`, `unblacklist_user:${item.username}`)
    ]);
  });

  ctx.reply(
    `🛑 Заблокировано:\n${formatFlagMessage(blocked, 'Нет заблокированных')}\n\n🚫 Черный список:\n${formatFlagMessage(blacklisted, 'Нет в ЧС')}`,
    flagButtons.length ? Markup.inlineKeyboard(flagButtons) : undefined
  );
});

bot.action('templates', async (ctx) => {
  await ctx.answerCbQuery();

  const templateButtons = [
    Markup.button.callback('✅ Привет! Скоро отвечу.', 'template:1'),
    Markup.button.callback('📌 Ваш проект принят в работу.', 'template:2'),
    Markup.button.callback('🕒 Напишу через 10 минут.', 'template:3'),
    Markup.button.callback('💬 Оставьте дополнительные детали.', 'template:4'),
    Markup.button.callback('🔙 Назад', 'back')
  ];

  ctx.reply('Выберите быстрый шаблон для просмотра. Чтобы отправить конкретному пользователю, нажмите кнопку в заявке.', Markup.inlineKeyboard(templateButtons, { columns: 1 }));
});

bot.command('help', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('⛔ Нет доступа');

  ctx.reply(`Команды администратора:\n
/start - Главное меню\n/blacklist @username [причина] - добавить в ЧС\n/unblacklist @username - удалить из ЧС\n/block @username [причина] - заблокировать\n/unblock @username - удалить из блока\n/message @username текст - отправить сообщение пользователю\n/stats - статистика\n/apps - последние заявки`);
});

const parseUsername = (text) => {
  if (!text) return null;
  const match = text.trim().split(' ');
  if (!match.length) return null;
  return match[0].replace(/^@/, '').toLowerCase();
};

const parseReason = (text) => {
  const parts = text.trim().split(' ');
  parts.shift();
  return parts.join(' ').trim();
};

const addUserFlag = async (username, type, reason = '') => {
  return UserFlag.findOneAndUpdate(
    { username, type },
    { username, type, reason, date: new Date() },
    { upsert: true, new: true }
  );
};

bot.command('blacklist', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('⛔ Нет доступа');
  const text = ctx.message.text.replace('/blacklist', '').trim();
  const username = parseUsername(text);
  const reason = parseReason(text);

  if (!username) return ctx.reply('Использование: /blacklist @username [причина]');

  await addUserFlag(username, 'blacklisted', reason);
  ctx.reply(`@${username} добавлен в черный список${reason ? `: ${reason}` : ''}`);
});

bot.command('unblacklist', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('⛔ Нет доступа');
  const username = parseUsername(ctx.message.text.replace('/unblacklist', '').trim());
  if (!username) return ctx.reply('Использование: /unblacklist @username');

  await UserFlag.deleteOne({ username, type: 'blacklisted' });
  ctx.reply(`@${username} удален из черного списка.`);
});

bot.command('block', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('⛔ Нет доступа');
  const text = ctx.message.text.replace('/block', '').trim();
  const username = parseUsername(text);
  const reason = parseReason(text);

  if (!username) return ctx.reply('Использование: /block @username [причина]');

  await addUserFlag(username, 'blocked', reason);
  ctx.reply(`@${username} заблокирован${reason ? `: ${reason}` : ''}`);
});

bot.command('unblock', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('⛔ Нет доступа');
  const username = parseUsername(ctx.message.text.replace('/unblock', '').trim());
  if (!username) return ctx.reply('Использование: /unblock @username');

  await UserFlag.deleteOne({ username, type: 'blocked' });
  ctx.reply(`@${username} разблокирован.`);
});

bot.command('message', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('⛔ Нет доступа');
  const args = ctx.message.text.replace('/message', '').trim();
  const username = parseUsername(args);
  const text = args.split(' ').slice(1).join(' ').trim();

  if (!username || !text) return ctx.reply('Использование: /message @username текст сообщения');

  try {
    await bot.telegram.sendMessage(username, `📩 Сообщение от администратора:\n\n${text}`);
    ctx.reply(`Сообщение отправлено @${username}.`);
  } catch (e) {
    ctx.reply(`Не удалось отправить сообщение: ${e.message}`);
  }
});

bot.action(/manage:(.+)/, async (ctx) => {
  await ctx.answerCbQuery();
  const username = ctx.match[1];

  ctx.reply(
    `Управление пользователем @${username}:`,
    Markup.inlineKeyboard([
      [Markup.button.callback('📩 Быстрый шаблон', `write_tpl:${username}`)],
      [Markup.button.callback('🚫 Заблокировать', `block_user:${username}`), Markup.button.callback('⚠️ В ЧС', `blacklist_user:${username}`)],
      [Markup.button.callback('🔓 Разблокировать', `unblock_user:${username}`), Markup.button.callback('✅ Убрать из ЧС', `unblacklist_user:${username}`)],
      [Markup.button.callback('🔙 Назад', 'start')]
    ])
  );
});

bot.action(/write_tpl:(.+)/, async (ctx) => {
  await ctx.answerCbQuery();
  const username = ctx.match[1];
  const templateButtons = [
    Markup.button.callback('✅ Привет! Скоро отвечу.', `send_tpl:${username}:1`),
    Markup.button.callback('📌 Ваш проект принят в работу.', `send_tpl:${username}:2`),
    Markup.button.callback('🕒 Напишу через 10 минут.', `send_tpl:${username}:3`),
    Markup.button.callback('💬 Оставьте дополнительные детали.', `send_tpl:${username}:4`),
    Markup.button.callback('🔙 Назад', `manage:${username}`)
  ];
  ctx.reply(`Выберите шаблон для @${username}:`, Markup.inlineKeyboard(templateButtons, { columns: 1 }));
});

const templates = {
  1: 'Привет! Спасибо за заявку, скоро отвечу.',
  2: 'Ваш проект принят в работу. Я свяжусь с вами в ближайшее время.',
  3: 'Напишу через 10 минут, держитесь на связи.',
  4: 'Пожалуйста, оставьте дополнительные детали по проекту.'
};

bot.action(/send_tpl:(.+):([0-9]+)/, async (ctx) => {
  await ctx.answerCbQuery();
  const username = ctx.match[1];
  const templateId = ctx.match[2];
  const text = templates[templateId];

  if (!text) return ctx.reply('Ошибка шаблона.');

  try {
    await bot.telegram.sendMessage(username, `📩 Сообщение от администратора:\n\n${text}`);
    ctx.reply(`Отправлено @${username}:\n${text}`);
  } catch (e) {
    ctx.reply(`Не удалось отправить сообщение: ${e.message}`);
  }
});

bot.action(/template:([0-9]+)/, async (ctx) => {
  await ctx.answerCbQuery();
  const templateId = ctx.match[1];
  const text = templates[templateId];
  if (!text) return ctx.reply('Ошибка шаблона.');
  ctx.reply(`Шаблон #${templateId}:\n${text}`);
});

bot.action(/blacklist_user:(.+)/, async (ctx) => {
  await ctx.answerCbQuery();
  const username = ctx.match[1];
  await addUserFlag(username, 'blacklisted', 'Добавлен через меню');
  ctx.reply(`@${username} добавлен в черный список.`);
});

bot.action(/unblacklist_user:(.+)/, async (ctx) => {
  await ctx.answerCbQuery();
  const username = ctx.match[1];
  await UserFlag.deleteOne({ username, type: 'blacklisted' });
  ctx.reply(`@${username} удален из черного списка.`);
});

bot.action(/block_user:(.+)/, async (ctx) => {
  await ctx.answerCbQuery();
  const username = ctx.match[1];
  await addUserFlag(username, 'blocked', 'Добавлен через меню');
  ctx.reply(`@${username} заблокирован.`);
});

bot.action(/unblock_user:(.+)/, async (ctx) => {
  await ctx.answerCbQuery();
  const username = ctx.match[1];
  await UserFlag.deleteOne({ username, type: 'blocked' });
  ctx.reply(`@${username} разблокирован.`);
});

bot.action('back', async (ctx) => {
  await ctx.answerCbQuery();
  return bot.start(ctx);
});

bot.action('start', async (ctx) => {
  await ctx.answerCbQuery();
  return bot.start(ctx);
});

// ================== API ==================
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/api/contact', async (req, res) => {
  try {
    const { name, phone, telegram, message } = req.body;

    if (!name || !phone || !telegram) {
      return res.status(400).json({ error: 'Имя, телефон и ник в Telegram обязательны' });
    }

    const newApp = new Application({
      name,
      phone,
      telegram: telegram.replace(/^@/, '').trim(),
      message,
      ip: req.ip
    });

    await newApp.save();

    // отправка в телеграм
    try {
      await bot.telegram.sendMessage(
        ADMIN_ID,
        `🚨 Новая заявка\n👤 ${name}\n📞 ${phone}\n💬 @${newApp.telegram}\n📝 ${message}`,
        {
          reply_markup: {
            inline_keyboard: [[
              { text: '📩 Написать', url: `https://t.me/${newApp.telegram}` },
              { text: '✅ Выполнено', callback_data: `done_${newApp._id}` },
              { text: '❌ Отмена', callback_data: `cancel_${newApp._id}` }
            ]]
          }
        }
      );
    } catch (e) {
      console.log('Ошибка отправки в ТГ:', e.message);
    }

    res.json({ success: true });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ================== STATUS UPDATE ==================
bot.action(/done_(.+)/, async (ctx) => {
  const id = ctx.match[1];
  await Application.findByIdAndUpdate(id, { status: 'completed' });
  await ctx.answerCbQuery('Готово');
  ctx.reply('✅ Завершено');
});

bot.action(/cancel_(.+)/, async (ctx) => {
  const id = ctx.match[1];
  await Application.findByIdAndUpdate(id, { status: 'cancelled' });
  await ctx.answerCbQuery('Отменено');
  ctx.reply('❌ Отменено');
});

// ================== SERVER ==================
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
});

// graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
