const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const { boolean } = require('webidl-conversions');
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
  created_at: Date,
  updated_at: Date,
  deleted_at: Date,
  due_date: Date,
  status: String,
  priority: Number,
});

const Task = mongoose.model('Task', taskSchema);

// Subtask schema Structure
const subTaskSchema = new mongoose.Schema({
  subtask_id: String,
  task_id: String,
  status: Number,
  created_at: Date,
  updated_at: Date,
  deleted_at: Date,
});

const SubTask = mongoose.model('SubTask', subTaskSchema);

  

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
    const { title, description, due_date} = req.body;
    // Get the current timestamp
    const currentTimestamp = new Date();
  
    try {
      const newTask = new Task({
        task_id: uuid.v4(),
        title,
        description,
        due_date,
        created_at: currentTimestamp,
        updated_at: currentTimestamp,
        deleted_at: null,
        status: "TODO",
        priority: null,
      });
  
      await newTask.save();
      res.status(201).json(newTask);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  

// Route to create a new subtask with a specific task_id
app.post('/subtasks/:task_id', authenticateToken, async (req, res) => {
    const { task_id } = req.params;
    // Get the current timestamp
    const currentTimestamp = new Date();
  
    try {
      const newSubTask = new SubTask({
        subtask_id: uuid.v4(),
        task_id,
        status: 0,
        created_at: currentTimestamp,
        updated_at: currentTimestamp,
        deleted_at: null,
      });
  
      await newSubTask.save();
      res.status(201).json(newSubTask);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  
// Route to get all user tasks with filters and pagination
app.get('/tasks', authenticateToken, async (req, res) => {
    const { priority, due_date, page = 1, limit = 10 } = req.query;
  
    try {
      let query = {};
  
      if (priority) {
        query.priority = priority; 
      }
  
      if (due_date) {
        query.due_date = { $lte: new Date(due_date) };
      }
  
      const tasks = await Task.find(query)
        .skip((page - 1) * limit)
        .limit(limit);
  
      res.json({ tasks });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });



  // Route to get all subtasks for a specific task
app.get('/subtasks/:task_id', authenticateToken, async (req, res) => {
    const { task_id } = req.params;
  
    try {
      const subTasks = await SubTask.find({ task_id });
  
      res.json({ subTasks });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Route to update a task
app.put('/tasks/:task_id', authenticateToken, async (req, res) => {
    const { task_id } = req.params;
    const { due_date, status } = req.body;
  
    try {
      const updatedTask = await Task.findOneAndUpdate(
        { task_id },
        { $set: { due_date, status } },
        { new: true }
      );
  
      if (!updatedTask) {
        return res.status(404).json({ error: 'Task not found' });
      }
  
      res.json({ message: 'Task updated successfully', updatedTask });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });



  // Route to update a subtask
app.put('/subtasks/:subtask_id', authenticateToken, async (req, res) => {
    const { subtask_id } = req.params;
    const { status } = req.body;
  
    try {
      const updatedSubtask = await SubTask.findOneAndUpdate(
        { subtask_id },
        { $set: { status } },
        { new: true }
      );
  
      if (!updatedSubtask) {
        return res.status(404).json({ error: 'Subtask not found' });
      }
  
      res.json({ message: 'Subtask updated successfully', updatedSubtask });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  

  // Route to soft delete a task
app.delete('/tasks/:task_id', authenticateToken, async (req, res) => {
    const { task_id } = req.params;
  
    // Get the current timestamp
    const currentTimestamp = new Date();
    try {
      // Soft delete by updating the status to "DELETED"
      const updatedTask = await Task.findOneAndUpdate(
        { task_id },
        { $set: { deleted_at: currentTimestamp } },
        { new: true }
      );
  
      if (!updatedTask) {
        return res.status(404).json({ error: 'Task not found' });
      }
  
      res.json({ message: 'Task soft deleted successfully', updatedTask });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });


// Route to soft delete a subtask
app.delete('/subtasks/:subtask_id', authenticateToken, async (req, res) => {
    const { subtask_id } = req.params;
  
    try {
      // Soft delete by updating the status to "DELETED"
      const updatedSubtask = await SubTask.findOneAndUpdate(
        { subtask_id },
        { $set: { status: 1 } },
        { new: true }
      );
  
      if (!updatedSubtask) {
        return res.status(404).json({ error: 'Subtask not found' });
      }
  
      res.json({ message: 'Subtask soft deleted successfully', updatedSubtask });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
