const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient, ObjectId } = require('mongodb');
const { exec } = require('child_process');
const serialize = require('node-serialize');

const app = express();
const PORT = process.env.PORT || 3000;

// Connection URI
const uri = 'mongodb://localhost:27017/task_manager';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Middleware
app.use(express.static('public'));
app.use(bodyParser.json());

// Routes
app.get('/tasks', async (req, res) => {
  try {
    await client.connect();
    const db = client.db();
    const tasks = await db.collection('tasks').find().toArray();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.close();
  }
});

app.post('/tasks', async (req, res) => {
  const { title, description } = req.body;

  try {
    await client.connect();
    const db = client.db();
    const newTask = { title, description };
    await db.collection('tasks').insertOne(newTask);

    // CWE-78: Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection')
    // To exploit this, under "Add Task" in the Title field enter the following:
    //      Make the server list files && ls -la
    // If you look at the output log on the server, you can see that it lists the contents of the current working directory.
    // Of course, you could call much more destructive terminal commands than ls.
    exec(`echo Task added: ${title}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing this command: ${error}`);
      }
      console.log(`Command output: ${stdout}`);
    });

    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.close();
  }
});

app.post('/import-tasks', async (req, res) => {
  try {
    const importedTasksJson = Buffer.from(req.body.tasks, 'base64').toString('utf-8');

    // CWE-502: Deserialization of Untrusted Data
    // To exploit this... TODO; show how we can craft a serialized obect that can cause remote code execution.
    const importedTasks = serialize.unserialize(importedTasksJson);

    await client.connect();
    const db = client.db();
    await db.collection('tasks').insertMany(importedTasks);

    res.status(201).json({ message: 'Tasks imported successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.close();
  }
});

app.get('/tasks/search/:title', async (req, res) => {
  const title = req.params.title;
  const query = { title: { $regex: title, $options: 'i' } }; // Case-insensitive regex
  // query = { $where: function() { return obj.title == ${req.params.title}; } }

  try {
    await client.connect();
    const db = client.db();
    const tasks = await db.collection('tasks').find(query).toArray();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.close();
  }
});

app.post('/tasks/:id/comments', async (req, res) => {
  const taskId = req.params.id;
  const { comment } = req.body;

  try {
    await client.connect();
    const db = client.db();
    const task = await db.collection('tasks').findOneAndUpdate(
      { _id: new ObjectId(taskId) },
      { $push: { comments: { text: comment } } },
      { returnDocument: 'after' }
    );

    res.status(201).json({ message: 'Comment added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.close();
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
