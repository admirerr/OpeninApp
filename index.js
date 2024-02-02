const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(bodyParser.json());

const secretKey = process.env.MY_SECRET_KEY

mongoose.connect(process.env.MY_MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Task schema Structure
const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  due_date: Date,
});

const Task = mongoose.model('Task', taskSchema);

// Middleware for JWT authentication
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.sendStatus(401);

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Creating Dummy User
const dummyUser = {
    username: 'john_doe',
    password: 'user_password',
};



// Dummy tasks array
let tasks = [];

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === dummyUser.username && password === dummyUser.password) {
        const token = jwt.sign({ username }, secretKey);
        res.json({ token });
    } else {
        res.sendStatus(401);
    }
});

app.post('/tasks', authenticateToken, (req, res) => {
    const { title, description, due_date } = req.body;

    // Saving the task to the tasks array
    tasks.push({ title, description, due_date });

    res.json({ message: 'Task created successfully' });
});

// Route to create a new task
app.post('/tasks', authenticateToken, async (req, res) => {
  const { title, description, due_date } = req.body;

  try {
    const newTask = new Task({ title, description, due_date });
    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
