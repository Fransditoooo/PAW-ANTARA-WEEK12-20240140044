const { Comment } = require('../models');

async function showComments(req, res) {
  try {
    const comments = await Comment.findAll({
      order: [['createdAt', 'DESC']],
    });

    res.render('komentar', {
      username: req.session.username,
      comments,
      errors: [],
      old: {
        name: '',
        text: '',
      },
    });
  } catch (error) {
    console.error('Gagal mengambil komentar:', error);

    res.status(500).send('Terjadi kesalahan pada server.');
  }
}

async function createComment(req, res) {
  try {
    let { name, text } = req.body;

    // =========================
    // 1. SERVER-SIDE VALIDATION
    // =========================

    name = typeof name === 'string' ? name.trim() : '';
    text = typeof text === 'string' ? text.trim() : '';

    const errors = [];

    if (!name) {
      errors.push('Nama wajib diisi.');
    }

    if (name.length > 50) {
      errors.push('Nama maksimal 50 karakter.');
    }

    if (!text) {
      errors.push('Komentar wajib diisi.');
    }

    if (text.length < 5) {
      errors.push('Komentar minimal 5 karakter.');
    }

    if (text.length > 500) {
      errors.push('Komentar maksimal 500 karakter.');
    }

    // Jika tidak valid, JANGAN simpan ke database
    if (errors.length > 0) {
      const comments = await Comment.findAll({
        order: [['createdAt', 'DESC']],
      });

      return res.status(400).render('komentar', {
        username: req.session.username,
        comments,
        errors,
        old: {
          name,
          text,
        },
      });
    }

    // =========================
    // 2. SANITASI INPUT
    // =========================

    const cleanName = name.trim();
    const cleanText = text.trim();

    console.log('Before sanitasi:', {
      name,
      text,
    });

    console.log('After sanitasi:', {
      name: cleanName,
      text: cleanText,
    });

    // =========================
    // 3. PARAMETERIZED QUERY
    // =========================
    // Sequelize ORM melakukan
    // parameter binding secara aman.

    await Comment.create({
      name: cleanName,
      text: cleanText,
    });

    res.redirect('/komentar');
  } catch (error) {
    console.error('Gagal menyimpan komentar:', error);

    res.status(500).send('Terjadi kesalahan pada server.');
  }
}

module.exports = {
  showComments,
  createComment,
};