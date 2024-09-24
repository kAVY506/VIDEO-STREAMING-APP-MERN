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
    // Find the video by ID in MongoDB
    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const videoPath = path.join(__dirname, '..', video.videoUrl);

    // Check if the video file exists
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: 'Video file not found' });
    }

    // Send the URL for the frontend to stream
    res.json({ videoUrl: `http://localhost:7000${video.videoUrl}` }); 
  } catch (err) {
    console.error('Error streaming video:', err);
    res.status(500).json({ error: 'Error streaming video' });
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
