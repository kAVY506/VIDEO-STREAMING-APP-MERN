const Video = require('../models/videoModel');
const multer = require('multer');
const fs = require('fs');
const path = require('path');



// Set up Multer to store files locally
const uploadDir = path.join(__dirname, '../uploads/videos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup to handle file uploads and store them in the "uploads/videos" folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Save files in uploads/videos
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname); // Extract the file extension
    cb(null, `video-${uniqueSuffix}${ext}`); // Create a unique filename
  }
});

const upload = multer({ storage });



// Video Upload
exports.uploadVideo = async (req, res) => {
  const { title, description, tags } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    // Construct the file URL to serve the video from the local uploads directory
    const videoUrl = `/uploads/videos/${file.filename}`;

    const userId = req.user ? req.user.id : 'mock-user-id'; 

    // Save video metadata to MongoDB
    const video = new Video({
      title,
      description,
      tags: tags.split(','),
      videoUrl, // Save the local video URL
      uploadedBy: userId, 
    });

    await video.save();
    res.json(video);
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ error: 'Error uploading video' });
  }
};

// Video Streaming from local storage
exports.streamVideo = async (req, res) => {
  const videoId = req.params.id;
  try {
    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const videoPath = path.join(__dirname, '..', video.videoUrl); // Get local file path
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      });
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (err) {
    console.error('Error streaming video:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error streaming video' });
    }
  }
};

// Video Search and Listing
exports.getVideos = async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;
  const query = search ? { title: new RegExp(search, 'i') } : {}; // Search functionality

  try {
    // Fetch video metadata
    const videos = await Video.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      

    const total = await Video.countDocuments(query);

    // Return videos and pagination info
    res.json({
      videos,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Error fetching videos:', err);
    res.status(500).json({ error: 'Error fetching videos' });
  }
};
