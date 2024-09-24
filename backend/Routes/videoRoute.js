const express = require('express');
const { uploadVideo, streamVideo, getVideos } = require('../controllers/videoController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();
const multer = require('multer');

// Multer setup to store files in "uploads/videos"
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/videos'); // Save files to uploads/videos directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Video Upload (POST)
router.post('/upload', protect, upload.single('video'), uploadVideo);

// Stream Video (GET)
router.get('/stream/:id', streamVideo);

// Video Listing and Search (GET)
router.get('/', getVideos);

module.exports = router;
