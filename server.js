const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const serialize = require('node-serialize');
const { exec } = require('child_process');

const app = express();

// Middleware
app.use(express.static('public'));
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// MySQL Connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'task_manager'
});

// Create the database and table on initialization
connection.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL: ' + err.stack);
    return;
  }

  connection.query('CREATE DATABASE IF NOT EXISTS task_manager', (err) => {
    if (err) throw err;
    connection.query('USE task_manager', (err) => {
      if (err) throw err;

      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS tasks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          comments JSON
        )
      `;

      connection.query(createTableQuery, (err) => {
        if (err) throw err;
        console.log('Connected to MySQL and initialized database');
      });
    });
  });
});

// API Routes

// Get all tasks
app.get('/tasks', (req, res) => {
  const query = 'SELECT * FROM tasks';

  connection.query(query, (err, results) => {
    if (err) {
      console.error(`Error: ${err.message}`);
      res.status(500).json({ err: 'Internal Server Error' });
    } else {
      res.json(results);
    }
  });
});

// Add a task
app.post('/tasks', (req, res) => {
  const task = req.body;
  const query = 'INSERT INTO tasks SET ?';

  // CWE-78: Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection')
  // To exploit this, under "Add Task" in the Title field enter the following:
  //      Make the server list files && ls -la
  // If you look at the output log on the server, you can see that it lists the contents of the current working directory.
  // Of course, you could call much more destructive terminal commands than ls.
  exec(`echo Task to add: ${task.title}`, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error executing this command: ${err}`);
    }
    console.log(`Command output: ${stdout}`);
  });

  connection.query(query, task, (err, result) => {
    if (err) {
      console.error(`Error: ${err.message}`);
      res.status(500).json({ err: 'Internal Server Error' });
    } else {
      res.json({ id: result.insertId, ...task });
    }
  });
});

// Update a task
app.put('/tasks/:id', (req, res) => {
  const taskId = req.params.id;
  const updatedTask = req.body;
  const query = 'UPDATE tasks SET ? WHERE id = ?';

  connection.query(query, [updatedTask, taskId], (err) => {
    if (err) {
      console.error(`Error: ${err.message}`);
      res.status(500).json({ err: 'Internal Server Error' });
    } else {
      res.json({ id: taskId, ...updatedTask });
    }
  });
});

// Delete a task
app.delete('/tasks/:id', (req, res) => {
  // CWE-89: Improper Neutralization of Special Elements used in an SQL Command ('SQL Injection')
  // To exploit this, under "Add Task" in the Title field enter the following:
  //      Make the server list files && ls -la
  // If you look at the output log on the server, you can see that it lists the contents of the current working directory.
  // Of course, you could call much more destructive terminal commands than ls.  
  const query = `DELETE FROM tasks WHERE id = ${req.params.id}`;

  connection.query(query, (err) => {
    if (err) {
      console.error(`Error: ${err.message}`);
      res.status(500).json({ err: 'Internal Server Error' });
    } else {
      res.json({ id: req.params.id, message: 'Task deleted successfully' });
    }
  });
});

// Bulk import tasks from base64-encoded JSON data
app.post('/tasks/import', (req, res) => {
  const importTasks = Buffer.from(req.body.tasks, 'base64').toString('utf-8');
  const tasks = serialize.unserialize(importTasks);

  const values = tasks.map(task => [task.title, task.description, JSON.stringify(task.comments)]);
  const query = 'INSERT INTO tasks (title, description, comments) VALUES ?';

  connection.query(query, [values], (err) => {
    if (err) {
      console.error(`Error: ${err.message}`);
      res.status(500).json({ err: 'Internal Server Error' });
    } else {
      res.json({ message: 'Tasks imported successfully' });
    }
  });
});

app.get('/tasks/search/:title', async (req, res) => {
  const title = '%' + req.params.title + '%';
  const query = 'SELECT * FROM tasks WHERE title LIKE ?';

  connection.query(query, [title], (err, results) => {
    if (err) {
      console.error(`Error: ${err.message}`);
      res.status(500).json({ err: 'Internal Server Error' });
    } else {
      res.json(results);
    }
  });
});

app.post('/tasks/:id/comments', async (req, res) => {
  const taskId = req.params.id;
  const { comment } = req.body;
  const query = 'UPDATE tasks SET comments = JSON_SET(coalesce(comments, \'[]\'), \'$[0]\', ?) WHERE id = ?';

  connection.query(query, [comment, taskId], (err) => {
    if (err) {
      console.error(`Error: ${err.message}`);
      res.status(500).json({ err: 'Internal Server Error' });
    } else {
      res.json({ id: taskId, message: 'Comment added successfully' });
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
