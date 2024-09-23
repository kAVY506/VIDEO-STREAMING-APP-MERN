// src/components/VideoDetail.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../axios';

const VideoDetail = () => {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await axios.get(`/videos/${id}`);
        setVideo(response.data);
        setComments(response.data.comments);
      } catch (error) {
        console.error('Error fetching video details', error);
      }
    };

    fetchVideo();
  }, [id]);

  const handleLike = async () => {
    try {
      await axios.post(`/like/${id}`);
      // Update the video details
      setVideo({ ...video, likes: video.likes + 1 });
    } catch (error) {
      console.error('Error liking video', error);
    }
  };

  const handleDislike = async () => {
    try {
      await axios.post(`/dislike/${id}`);
      // Update the video details
      setVideo({ ...video, dislikes: video.dislikes + 1 });
    } catch (error) {
      console.error('Error disliking video', error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`/comment/${id}`, {
        user: 'Anonymous', // Replace with actual user in production
        text: comment,
      });
      setComments(response.data.comments);
      setComment(''); // Clear the comment field
    } catch (error) {
      console.error('Error adding comment', error);
    }
  };

  return (
    <div>
      {video && (
        <div>
          <h2>{video.title}</h2>
          <video controls src={`http://localhost:5000/videos/stream/${video.filePath.split('/').pop()}`} />
          <p>{video.description}</p>
          <p>Likes: {video.likes} | Dislikes: {video.dislikes}</p>
          <button onClick={handleLike}>Like</button>
          <button onClick={handleDislike}>Dislike</button>

          <h3>Comments</h3>
          <ul>
            {comments.map((comment, index) => (
              <li key={index}>{comment.user}: {comment.text}</li>
            ))}
          </ul>

          <form onSubmit={handleCommentSubmit}>
            <textarea
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
            <button type="submit">Submit</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default VideoDetail;
