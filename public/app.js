document.addEventListener('DOMContentLoaded', () => {

  displayAllTasks();

  // Filter Form Submission
  const filterForm = document.getElementById('filter-form');
  filterForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const filterTitle = document.getElementById('filter-title').value;

    if (!filterTitle.trim()) {
      displayAllTasks();
      return;
    }

    try {
      const response = await fetch(`/tasks/search/${filterTitle}`);
      if (response.ok) {
        const tasks = await response.json();
        displayFilterResults(tasks);
      } else {
        console.error('Error filtering tasks:', response.statusText);
      }
    } catch (error) {
      console.error('Error filtering tasks:', error);
    }
  });

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
    const taskTable = document.getElementById('filtered-task-list').getElementsByTagName('tbody')[0];
    taskTable.innerHTML = '';

    tasks.forEach((task) => {
    const row = taskTable.insertRow();

    // Add ID column
    const idCell = row.insertCell(0);
    idCell.textContent = task._id;

    // Add Title column
    const titleCell = row.insertCell(1);
    titleCell.innerHTML = `<strong>${task.title}</strong>`;

    // Add Description column
    const descriptionCell = row.insertCell(2);
    descriptionCell.textContent = task.description;

    // Add Comments column
    const commentsCell = row.insertCell(3);
    if (task.comments.length > 0) {
        const commentsList = document.createElement('ul');
        task.comments.forEach((comment) => {
          const commentItem = document.createElement('li');
          commentItem.textContent = comment.text;
          commentsList.appendChild(commentItem);
        });
        commentsCell.appendChild(commentsList);
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
  }
}

// Function to display search results
function displayFilterResults(tasks) {
  const taskTable = document.getElementById('filtered-task-list').getElementsByTagName('tbody')[0];
  taskTable.innerHTML = '';

  tasks.forEach((task) => {
    const row = taskTable.insertRow();

    // Add ID column
    const idCell = row.insertCell(0);
    idCell.textContent = task._id;

    // Add Title column
    const titleCell = row.insertCell(1);
    titleCell.innerHTML = `<strong>${task.title}</strong>`;

    // Add Description column
    const descriptionCell = row.insertCell(2);
    descriptionCell.textContent = task.description;

    // Add Comments column
    const commentsCell = row.insertCell(3);
    if (task.comments.length > 0) {
      const commentsList = document.createElement('ul');
      task.comments.forEach((comment) => {
        const commentItem = document.createElement('li');
        commentItem.textContent = comment.text;
        commentsList.appendChild(commentItem);
      });
      commentsCell.appendChild(commentsList);
    }
  });
}
