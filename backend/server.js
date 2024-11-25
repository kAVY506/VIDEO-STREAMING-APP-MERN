const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to database
connectDB();


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



app.use('/api/auth', require('./Routes/userRoute'));
app.use('/api/videos', require('./Routes/videoRoute'));

const PORT =  7000;
app.listen(PORT, () => {
  console.log("Server running on port" +PORT);
});
