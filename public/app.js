document.addEventListener('DOMContentLoaded', () => {
  displayAllTasks();

  // Add Task Form Submission
  const addTaskForm = document.getElementById('add-task-form');
  addTaskForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;

    try {
      const response = await fetch('/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description }),
      });

      if (response.ok) {
        displayAllTasks();
        addTaskForm.reset();
      } else {
        console.error('Error adding task:', response.statusText);
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  });
  
  // Import Tasks Form Submission
  const importTasksForm = document.getElementById('import-tasks-form');
  importTasksForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const importTasksTextarea = document.getElementById('import-tasks');
    const importedTasksJson = importTasksTextarea.value.trim();

    try {
      const base64EncodedTasks = btoa(importedTasksJson); // Convert to base64
      const response = await fetch('/import-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tasks: base64EncodedTasks }),
      });

      if (response.ok) {
        displayAllTasks();
        importTasksForm.reset();
      } else {
        console.error('Error importing tasks:', response.statusText);
      }
    } catch (error) {
      console.error('Error importing tasks:', error);
    }
  });

  // Search Form Submission
  const searchForm = document.getElementById('search-form');
  searchForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const searchTitle = document.getElementById('search-title').value;

    try {
      const response = await fetch(`/tasks/search/${searchTitle}`);
      if (response.ok) {
        const tasks = await response.json();
        displaySearchResults(tasks);
      } else {
        console.error('Error searching tasks:', response.statusText);
      }
    } catch (error) {
      console.error('Error searching tasks:', error);
    }
  });

  // Task Comment Form Submission
  const commentForm = document.getElementById('comment-form');
  commentForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const commentTaskId = document.getElementById('comment-task-id').value;
    const commentText = document.getElementById('comment-text').value;

    try {
      const response = await fetch(`/tasks/${commentTaskId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment: commentText }),
      });

      if (response.ok) {
        console.log('Comment added successfully');
        // Refresh the task list after adding a comment
        displayAllTasks();
        commentForm.reset();
      } else {
        console.error('Error adding comment:', response.statusText);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  });  
});

// Function to fetch and display all tasks
async function displayAllTasks() {
  try {
    const tasks = await fetch('/tasks').then((res) => res.json());
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';

    tasks.forEach((task) => {
      const listItem = document.createElement('li');
      listItem.textContent = `${task.title} - ${task.description}`;
      taskList.appendChild(listItem);
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
  }
}

// Function to display search results
function displaySearchResults(tasks) {
  const taskList = document.getElementById('search-result');
  taskList.innerHTML = '';

  tasks.forEach((task) => {
    const listItem = document.createElement('li');
    // can be demonstrated by adding the following into a task description:
    // <button onclick="alert()">Show alert dialog</button>
    listItem.innerHTML = `(${task._id}) <strong>${task.title}</strong> - ${task.description}`;
    
    // Display comments as an indented list
    if (task.comments.length > 0) {
      const commentsList = document.createElement('ul');
      task.comments.forEach((comment) => {
        const commentItem = document.createElement('li');
        commentItem.textContent = comment.text;
        commentsList.appendChild(commentItem);
      });
      listItem.appendChild(commentsList);
    }

    taskList.appendChild(listItem);
  });
}
