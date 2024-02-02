const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(bodyParser.json());

const secretKey = 'YOUR_SECRET_KEY';

mongoose.connect('YOUR_MONGO_URI', { useNewUrlParser: true, useUnifiedTopology: true });

// Task schema Structure
const taskSchema = new mongoose.Schema({
  task_id: String,
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
    username: 'Shubham',
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

// Route to create a new task
app.post('/tasks', authenticateToken, async (req, res) => {
    const { title, description, due_date } = req.body;
  
    try {
      const newTask = new Task({
        task_id: uuid.v4(), // Generating a unique task_id
        title,
        description,
        due_date,
      });
  
      await newTask.save();
      res.status(201).json(newTask);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  

app.post('/subtasks/:task_id', authenticateToken, (req, res) => {
    const { task_id } = req.params;
    const { title, description, due_date } = req.body;

    const subTask = {
        task_id,
        title,
        description,
        due_date,
    };

    // Save the sub-task (in a real application, save it to a database)
    // For simplicity, we'll just push it to a tasks array
    tasks.push(subTask);

    res.json({ message: 'Sub-task created successfully', subTask });
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
