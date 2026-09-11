const { Telegraf, Markup } = require('telegraf');
const connectDB = require('../lib/db');
const Ban = require('../models/Ban');
const Warn = require('../models/Warn');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// 🟢 PERINTAH /start
bot.command('start', async (ctx) => {
  if (ctx.chat.type === 'private') {
    const text = `🤖 <b>𝗚 𝗨 𝗔 𝗥 𝗗 𝗜 𝗔 𝗡   𝗜 𝗡 𝗜 𝗧 𝗜 𝗔 𝗧 𝗘 𝗗</b>
<blockquote>╭──────── <b>[ 𝗠 𝗔 𝗜 𝗡   𝗠 𝗘 𝗡 𝗨 ]</b> ────────
├ 👤 <b>Otoritas :</b> @${ctx.from.username || ctx.from.first_name}
├ ⚙️ <b>Sistem   :</b> Vercel Serverless (Aktif)
├ 🗄️ <b>Database :</b> MongoDB Terhubung
╰ 🛡️ <b>Status   :</b> Menunggu Instruksi</blockquote>
<i>❝ Selamat datang di pusat komando. Sistem otonom siap. ❞</i>`;
    
    return ctx.replyWithHTML(text, Markup.inlineKeyboard([
      [Markup.button.url('➕ Deploy ke Grup Anda', `https://t.me/${ctx.botInfo.username}?startgroup=true`)],
      [Markup.button.callback('⚙️ Panel Kontrol', 'panel'), Markup.button.callback('📖 Manual', 'manual')]
    ]));
  } else {
    // Jika di Grup
    const memberCount = await ctx.getChatMembersCount();
    const admins = await ctx.getChatAdministrators();
    const adminCount = admins.length;

    const text = `🛡️ <b>𝗦 𝗘 𝗖 𝗨 𝗥 𝗜 𝗧 𝗬   𝗢 𝗡 𝗟 𝗜 𝗡 𝗘</b>
<blockquote>╭──────── <b>[ 𝗚 𝗥 𝗢 𝗨 𝗣   𝗦 𝗖 𝗔 𝗡 ]</b> ─────────
├ 📌 <b>Lokasi  :</b> ${ctx.chat.title}
├ 📡 <b>Koneksi :</b> Terhubung ke Server Utama
├ 👥 <b>Anggota :</b> <code>${memberCount}</code> Populasi
╰ 👮‍♂️ <b>Admin   :</b> <code>${adminCount}</code> Otoritas Aktif</blockquote>
<i>❝ Pemindaian area selesai. Protokol keamanan beroperasi. ❞</i>`;
    
    return ctx.replyWithHTML(text);
  }
});

// ⚠️ PERINTAH /warn
bot.command('warn', async (ctx) => {
  if (!ctx.message.reply_to_message) return ctx.reply("Balas pesan pengguna yang ingin di-warn.");
  
  await connectDB();
  const targetId = ctx.message.reply_to_message.from.id.toString();
  const targetName = ctx.message.reply_to_message.from.first_name;
  const reason = ctx.message.text.split(' ').slice(1).join(' ') || 'Melanggar aturan grup';

  let userWarn = await Warn.findOne({ userId: targetId, groupId: ctx.chat.id.toString() });
  if (!userWarn) userWarn = new Warn({ userId: targetId, groupId: ctx.chat.id.toString(), count: 0 });
  
  userWarn.count += 1;
  await userWarn.save();

  const text = `⚠️ <b>𝗦 𝗬 𝗦 𝗧 𝗘 𝗠   𝗪 𝗔 𝗥 𝗡 𝗜 𝗡 𝗚</b>
<blockquote>╭──────── <b>[ 𝗘 𝗫 𝗘 𝗖 𝗨 𝗧 𝗜 𝗢 𝗡 ]</b> ────────
├ 👤 <b>Target :</b> ${targetName}
├ 📝 <b>Alasan :</b> <i>${reason}</i>
╰ 📊 <b>Status :</b> <code>[ ${userWarn.count} / 3 ]</code></blockquote>
<i>❝ Peringatan dicatat. Pelanggaran selanjutnya berakibat sanksi otomatis. ❞</i>`;

  return ctx.replyWithHTML(text, { reply_to_message_id: ctx.message.message_id });
});

// ⛔️ PERINTAH /ban
bot.command('ban', async (ctx) => {
  if (!ctx.message.reply_to_message) return ctx.reply("Balas pesan pengguna yang ingin di-ban.");
  
  await connectDB();
  const target = ctx.message.reply_to_message.from;
  
  try {
    await ctx.banChatMember(target.id);
    
    // Simpan ke MongoDB
    await Ban.create({
      userId: target.id.toString(),
      name: target.first_name,
      reason: 'Ban manual oleh Admin',
      adminId: ctx.from.username || ctx.from.first_name,
      groupId: ctx.chat.id.toString()
    });

    const text = `⛔️ <b>𝗘 𝗫 𝗧 𝗘 𝗥 𝗠 𝗜 𝗡 𝗔 𝗧 𝗜 𝗢 𝗡</b>
<blockquote>╭──────── <b>[ 𝗣 𝗘 𝗥 𝗠 𝗔 - 𝗕 𝗔 𝗡 ]</b> ────────
├ 👤 <b>Target   :</b> ${target.first_name}
├ 🛡️ <b>Tindakan :</b> Blokir Permanen
╰ 👮‍♂️ <b>Otoritas :</b> @${ctx.from.username || ctx.from.first_name}</blockquote>
<i>❝ Ancaman terdeteksi dan telah dibersihkan dari ekosistem secara permanen. ❞</i>`;
    
    return ctx.replyWithHTML(text);
  } catch (error) {
    return ctx.reply("Gagal mengeksekusi ban. Pastikan bot adalah Admin.");
  }
});

// 📡 PERINTAH /cari [ID]
bot.command('cari', async (ctx) => {
  const queryId = ctx.message.text.split(' ')[1];
  if (!queryId) return ctx.reply("Masukkan ID. Contoh: /cari 12345678");

  await connectDB();
  const bannedUser = await Ban.findOne({ userId: queryId });

  // Skenario 1: Ditemukan di Daftar Hitam
  if (bannedUser) {
    const text = `📡 <b>𝗧 𝗔 𝗥 𝗚 𝗘 𝗧   𝗧 𝗥 𝗔 𝗖 𝗞 𝗜 𝗡 𝗚</b>
<blockquote>╭──────── <b>[ 𝗦 𝗧 𝗔 𝗧 𝗨 𝗦 : 𝗕 𝗔 𝗡 𝗡 𝗘 𝗗 ]</b> ────────
├ 👤 <b>Nama   :</b> <code>${bannedUser.name}</code>
├ 🆔 <b>ID     :</b> <code>${bannedUser.userId}</code>
├ 📝 <b>Alasan :</b> <i>${bannedUser.reason}</i>
╰ 👮‍♂️ <b>Oleh   :</b> ${bannedUser.adminId}</blockquote>
<i>❝ Target ditemukan dalam Daftar Hitam. Akses diputus permanen. ❞</i>`;
    
    return ctx.replyWithHTML(text, Markup.inlineKeyboard([
      Markup.button.url('💬 M U L A I  C H A T', `tg://user?id=${queryId}`)
    ]));
  }

  // Skenario 2 & 3: Cek di Grup
  try {
    const chatMember = await ctx.telegram.getChatMember(ctx.chat.id, queryId);
    let warnData = await Warn.findOne({ userId: queryId, groupId: ctx.chat.id.toString() });
    let warnCount = warnData ? warnData.count : 0;

    const text = `📡 <b>𝗧 𝗔 𝗥 𝗚 𝗘 𝗧   𝗧 𝗥 𝗔 𝗖 𝗞 𝗜 𝗡 𝗚</b>
<blockquote>╭──────── <b>[ 𝗦 𝗧 𝗔 𝗧 𝗨 𝗦 : 𝗔 𝗖 𝗧 𝗜 𝗩 𝗘 ]</b> ────────
├ 👤 <b>Nama   :</b> <code>${chatMember.user.first_name}</code>
├ 🆔 <b>ID     :</b> <code>${chatMember.user.id}</code>
├ 🛡️ <b>Role   :</b> <code>${chatMember.status}</code>
╰ ⚠️ <b>Warn   :</b> <code>[ ${warnCount} / 3 ]</code></blockquote>
<i>❝ Target berstatus aman dan sedang berada di pantauan grup. ❞</i>`;
    
    return ctx.replyWithHTML(text, Markup.inlineKeyboard([
      Markup.button.url('💬 M U L A I  C H A T', `tg://user?id=${queryId}`)
    ]));

  } catch (error) {
    const text = `📡 <b>𝗧 𝗔 𝗥 𝗚 𝗘 𝗧   𝗧 𝗥 𝗔 𝗖 𝗞 𝗜 𝗡 𝗚</b>
<blockquote>╭──────── <b>[ 𝗦 𝗧 𝗔 𝗧 𝗨 𝗦 : 𝗨 𝗡 𝗞 𝗡 𝗢 𝗪 𝗡 ]</b> ────────
├ 🆔 <b>ID Query :</b> <code>${queryId}</code>
╰ 🛑 <b>Hasil    :</b> <code>Nihil / Tidak ditemukan</code></blockquote>
<i>❝ Sistem gagal melacak ID. Entitas tidak ada di arsip grup maupun daftar hitam. ❞</i>`;
    
    return ctx.replyWithHTML(text);
  }
});

// Aksi Tombol TUTUP untuk panel interaktif
bot.action('close_panel', (ctx) => {
  ctx.deleteMessage();
});

// --- PINTU MASUK VERCEL SERVERLESS (DIPERBAIKI) ---
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body); // Diperbaiki: Hapus parameter 'res' di sini
      return res.status(200).send('OK');
    } catch (err) {
      console.error(err);
      return res.status(500).send('Something went wrong.');
    }
  } else {
    return res.status(200).send('Sistem Bot Online dan Menunggu Webhook Telegram.');
  }
}
