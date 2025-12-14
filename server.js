import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// mongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// mongoose schema
const courseSchema = new mongoose.Schema({
  department: String,
  course_number: String,
  title: String,
  credits: Number,
  average_gpa: Number
});

const Course = mongoose.model('Course', courseSchema);

// search courses using PlanetTerp API
app.get('/search', async (req, res) => {
  const { department, className, minGPA } = req.query;

  try {
    const params = {
      limit: 100
    };
    if (department) params.department = department;
    const response = await axios.get('https://planetterp.com/api/v1/courses', { params });
    let courses = response.data;

    // filter by class number
    if (className) {
      courses = courses.filter(c => c.course_number.toString().includes(className));
    }

    // filter by GPA
    if (minGPA) {
      courses = courses.filter(c => c.average_gpa >= Number(minGPA));
    }

    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Add course to watchlist
app.post('/watchlist', async (req, res) => {
  try {
    const exists = await Course.findOne({
      department: req.body.department,
      course_number: req.body.course_number
    });
    if (exists) return res.json({ message: 'Already in watchlist' });

    const course = new Course(req.body);
    await course.save();
    res.json({ message: 'Added to watchlist', course });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add course' });
  }
});

// get watchlist
app.get('/watchlist', async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load watchlist' });
  }
});

// delete course from watchlist
app.delete('/watchlist/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await Course.findByIdAndDelete(id);
      res.json({ message: 'Course removed from watchlist' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete course' });
    }
  });

// serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

const PORT = 5001;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
