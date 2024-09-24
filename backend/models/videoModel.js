const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  tags: [String],
  
  videoUrl: { 
    type: String, 
    required: true 
  },
  
  uploadedBy: { 
    type: mongoose.Schema.Types.ObjectId, ref: 'User' 
  },
}, { timestamps: true });

module.exports = mongoose.model('Video', VideoSchema);
