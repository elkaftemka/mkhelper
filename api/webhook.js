const { Telegraf, Markup } = require('telegraf');
const connectDB = require('../lib/db');
const Ban = require('../models/Ban');
const Warn = require('../models/Warn');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// Username bot Anda yang sebenarnya di Telegram
const BOT_USERNAME = 'penjagajembot'; 

// 🟢 PERINTAH /start
bot.command('start', async (ctx) => {
  try {
    if (ctx.chat.type === 'private') {
      const text = `🤖 <b>𝗚 𝗨 𝗔 𝗥 𝗗 𝗜 𝗔 𝗡   𝗜 𝗡 𝗜 𝗧 𝗜 𝗔 𝗧 𝗘 𝗗</b>\n\n` +
`<code>╭──────── [ 𝗠 𝗔 𝗜 𝗡   𝗠 𝗘 𝗡 𝗨 ] ────────\n` +
`├ 👤 Otoritas : @${ctx.from.username || ctx.from.first_name}\n` +
`├ ⚙️ Sistem   : Vercel Serverless (Aktif)\n` +
`├ 🗄️ Database : MongoDB Terhubung\n` +
`╰ 🛡️ Status   : Menunggu Instruksi</code>\n\n` +
`<i>❝ Selamat datang di pusat komando. Sistem otonom siap. ❞</i>`;
      
      await ctx.replyWithHTML(text, Markup.inlineKeyboard([
        [Markup.button.url('➕ Deploy ke Grup Anda', `https://t.me/${BOT_USERNAME}?startgroup=true`)],
        [Markup.button.callback('⚙️ Panel Kontrol', 'panel'), Markup.button.callback('📖 Manual', 'manual')]
      ]));
    } else {
      // Jika di Grup
      const memberCount = await ctx.getChatMembersCount();
      const admins = await ctx.getChatAdministrators();
      const adminCount = admins.length;

      const text = `🛡️ <b>𝗦 𝗘 𝗖 𝗨 𝗥 𝗜 𝗧 𝗬   𝗢 𝗡 𝗟 𝗜 𝗡 𝗘</b>\n\n` +
`<code>╭──────── [ 𝗚 𝗥 𝗢 𝗨 𝗣   𝗦 𝗖 𝗔 𝗡 ] ─────────\n` +
`├ 📌 Lokasi  : ${ctx.chat.title}\n` +
`├ 📡 Koneksi : Terhubung ke Server Utama\n` +
`├ 👥 Anggota : ${memberCount} Populasi\n` +
`╰ 👮‍♂️ Admin   : ${adminCount} Otoritas Aktif</code>\n\n` +
`<i>❝ Pemindaian area selesai. Protokol keamanan beroperasi. ❞</i>`;
      
      await ctx.replyWithHTML(text);
    }
  } catch (err) {
    // Jaring pengaman: Jika terjadi kegagalan senyap (Parse Error dll), bot wajib lapor!
    console.error("Error pada perintah /start:", err);
    await ctx.reply(`⚠️ Peringatan Sistem: Gagal memuat UI Premium.\n\nPenyebab Error:\n${err.message}`);
  }
});

// ⚠️ PERINTAH /warn
bot.command('warn', async (ctx) => {
  try {
    if (!ctx.message.reply_to_message) return ctx.reply("Balas pesan pengguna yang ingin di-warn.");
    
    await connectDB();
    const targetId = ctx.message.reply_to_message.from.id.toString();
    const targetName = ctx.message.reply_to_message.from.first_name;
    const reason = ctx.message.text.split(' ').slice(1).join(' ') || 'Melanggar aturan grup';

    let userWarn = await Warn.findOne({ userId: targetId, groupId: ctx.chat.id.toString() });
    if (!userWarn) userWarn = new Warn({ userId: targetId, groupId: ctx.chat.id.toString(), count: 0 });
    
    userWarn.count += 1;
    await userWarn.save();

    const text = `⚠️ <b>𝗦 𝗬 𝗦 𝗧 𝗘 𝗠   𝗪 𝗔 𝗥 𝗡 𝗜 𝗡 𝗚</b>\n\n` +
`<code>╭──────── [ 𝗘 𝗫 𝗘 𝗖 𝗨 𝗧 𝗜 𝗢 𝗡 ] ────────\n` +
`├ 👤 Target : ${targetName}\n` +
`├ 📝 Alasan : ${reason}\n` +
`╰ 📊 Status : [ ${userWarn.count} / 3 ]</code>\n\n` +
`<i>❝ Peringatan dicatat. Pelanggaran selanjutnya berakibat sanksi otomatis. ❞</i>`;

    await ctx.replyWithHTML(text, { reply_to_message_id: ctx.message.message_id });
  } catch (err) {
    console.error("Error pada perintah /warn:", err);
    await ctx.reply(`⚠️ Gagal memuat UI Warn.\n\nPenyebab Error:\n${err.message}`);
  }
});

// ⛔️ PERINTAH /ban
bot.command('ban', async (ctx) => {
  try {
    if (!ctx.message.reply_to_message) return ctx.reply("Balas pesan pengguna yang ingin di-ban.");
    
    await connectDB();
    const target = ctx.message.reply_to_message.from;
    
    await ctx.banChatMember(target.id);
    
    // Simpan ke MongoDB
    await Ban.create({
      userId: target.id.toString(),
      name: target.first_name,
      reason: 'Ban manual oleh Admin',
      adminId: ctx.from.username || ctx.from.first_name,
      groupId: ctx.chat.id.toString()
    });

    const text = `⛔️ <b>𝗘 𝗫 𝗧 𝗘 𝗥 𝗠 𝗜 𝗡 𝗔 𝗧 𝗜 𝗢 𝗡</b>\n\n` +
`<code>╭──────── [ 𝗣 𝗘 𝗥 𝗠 𝗔 - 𝗕 𝗔 𝗡 ] ────────\n` +
`├ 👤 Target   : ${target.first_name}\n` +
`├ 🛡️ Tindakan : Blokir Permanen\n` +
`╰ 👮‍♂️ Otoritas : @${ctx.from.username || ctx.from.first_name}</code>\n\n` +
`<i>❝ Ancaman terdeteksi dan telah dibersihkan dari ekosistem secara permanen. ❞</i>`;
    
    await ctx.replyWithHTML(text);
  } catch (err) {
    console.error("Error pada perintah /ban:", err);
    await ctx.reply(`⚠️ Gagal mengeksekusi ban atau memuat UI.\n\nPenyebab Error:\n${err.message}\n(Pastikan bot adalah Admin).`);
  }
});

// 📡 PERINTAH /cari [ID]
bot.command('cari', async (ctx) => {
  try {
    const queryId = ctx.message.text.split(' ')[1];
    if (!queryId) return ctx.reply("Masukkan ID. Contoh: /cari 12345678");

    await connectDB();
    const bannedUser = await Ban.findOne({ userId: queryId });

    // Skenario 1: Ditemukan di Daftar Hitam
    if (bannedUser) {
      const text = `📡 <b>𝗧 𝗔 𝗥 𝗚 𝗘 𝗧   𝗧 𝗥 𝗔 𝗖 𝗞 𝗜 𝗡 𝗚</b>\n\n` +
`<code>╭──────── [ 𝗦 𝗧 𝗔 𝗧 𝗨 𝗦 : 𝗕 𝗔 𝗡 𝗡 𝗘 𝗗 ] ────────\n` +
`├ 👤 Nama   : ${bannedUser.name}\n` +
`├ 🆔 ID     : ${bannedUser.userId}\n` +
`├ 📝 Alasan : ${bannedUser.reason}\n` +
`╰ 👮‍♂️ Oleh   : ${bannedUser.adminId}</code>\n\n` +
`<i>❝ Target ditemukan dalam Daftar Hitam. Akses diputus permanen. ❞</i>`;
      
      return await ctx.replyWithHTML(text, Markup.inlineKeyboard([
        Markup.button.url('💬 M U L A I  C H A T', `tg://user?id=${queryId}`)
      ]));
    }

    // Skenario 2 & 3: Cek di Grup
    try {
      const chatMember = await ctx.telegram.getChatMember(ctx.chat.id, queryId);
      let warnData = await Warn.findOne({ userId: queryId, groupId: ctx.chat.id.toString() });
      let warnCount = warnData ? warnData.count : 0;

      const text = `📡 <b>𝗧 𝗔 𝗥 𝗚 𝗘 𝗧   𝗧 𝗥 𝗔 𝗖 𝗞 𝗜 𝗡 𝗚</b>\n\n` +
`<code>╭──────── [ 𝗦 𝗧 𝗔 𝗧 𝗨 𝗦 : 𝗔 𝗖 𝗧 𝗜 𝗩 𝗘 ] ────────\n` +
`├ 👤 Nama   : ${chatMember.user.first_name}\n` +
`├ 🆔 ID     : ${chatMember.user.id}\n` +
`├ 🛡️ Role   : ${chatMember.status}\n` +
`╰ ⚠️ Warn   : [ ${warnCount} / 3 ]</code>\n\n` +
`<i>❝ Target berstatus aman dan sedang berada di pantauan grup. ❞</i>`;
      
      await ctx.replyWithHTML(text, Markup.inlineKeyboard([
        Markup.button.url('💬 M U L A I  C H A T', `tg://user?id=${queryId}`)
      ]));

    } catch (innerError) {
      const text = `📡 <b>𝗧 𝗔 𝗥 𝗚 𝗘 𝗧   𝗧 𝗥 𝗔 𝗖 𝗞 𝗜 𝗡 𝗚</b>\n\n` +
`<code>╭──────── [ 𝗦 𝗧 𝗔 𝗧 𝗨 𝗦 : 𝗨 𝗡 𝗞 𝗡 𝗢 𝗪 𝗡 ] ────────\n` +
`├ 🆔 ID Query : ${queryId}\n` +
`╰ 🛑 Hasil    : Nihil / Tidak ditemukan</code>\n\n` +
`<i>❝ Sistem gagal melacak ID. Entitas tidak ada di arsip grup maupun daftar hitam. ❞</i>`;
      
      await ctx.replyWithHTML(text);
    }
  } catch (err) {
    console.error("Error pada perintah /cari:", err);
    await ctx.reply(`⚠️ Gagal memuat UI Pencarian.\n\nPenyebab Error:\n${err.message}`);
  }
});

// Aksi Tombol TUTUP untuk panel interaktif
bot.action('close_panel', (ctx) => {
  ctx.deleteMessage().catch(() => {});
});

// --- PINTU MASUK VERCEL SERVERLESS ---
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      return res.status(200).send('OK');
    } catch (err) {
      console.error("Critical Handler Error:", err);
      // Tetap kirim status 200 agar Telegram berhenti me-retry pesan error yang sama berulang kali
      return res.status(200).send('OK');
    }
  } else {
    return res.status(200).send('Sistem Bot Online dan Menunggu Webhook Telegram.');
  }
}
