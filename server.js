const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const serialize = require('node-serialize');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost/task_manager', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create Task schema
const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  comments: [{ text: String }],
});

const Task = mongoose.model('Task', taskSchema);

// Middleware
app.use(express.static('public')); // Serve static files from 'public' directory
app.use(bodyParser.json());

// Routes

app.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/tasks', async (req, res) => {
  const { title, description } = req.body;

  try {
    const newTask = new Task({ title, description });
    await newTask.save();

    exec(`echo Task added: ${title}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error}`);
        return;
      }
      console.log(`Command output: ${stdout}`);
    });

    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/import-tasks', async (req, res) => {
  try {
    const importedTasksJson = Buffer.from(req.body.tasks, 'base64').toString('utf-8');
    const importedTasks = serialize.unserialize(importedTasksJson);

    await Task.insertMany(importedTasks);
    res.status(201).json({ message: 'Tasks imported successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/tasks/search/:title', async (req, res) => {
  // Exploit with the following to return all rows:
  // ' || 'a'=='a
  query = { $where: `this.title == '${req.params.title}'` }

  try {
    const tasks = await Task.find(query);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/tasks/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;

  try {
    const task = await Task.findById(id);
    task.comments.push({ text: comment });
    await task.save();
    res.status(201).json({ message: 'Comment added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
