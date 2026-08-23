const express = require('express');

const router = express.Router();

const commentController = require('../controllers/comment.controller');

const requireAuth = require('../middlewares/auth.middleware');

router.get(
  '/komentar',
  requireAuth,
  commentController.showComments
);

router.post(
  '/komentar',
  requireAuth,
  commentController.createComment
);

module.exports = router;