document.addEventListener('DOMContentLoaded', () => {
    const todoListElement = document.getElementById('todo-list');
    const newTodoTitleInput = document.getElementById('new-todo-title');
    const newTodoDescriptionInput = document.getElementById('new-todo-description');
    const addTodoButton = document.getElementById('add-todo');
    const API_URL = 'http://127.0.0.1:8000/todos/';

    async function fetchData(url, method = 'GET', body = null) {
        const headers = {};
        if (body) {
            headers['Content-Type'] = 'application/json';
        }
        try {
            const response = await fetch(url, { method, headers, body });
            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(error.detail || `HTTP error! status: ${response.status}`);
            }
            return method !== 'DELETE' ? await response.json() : null;
        } catch (error) {
            console.error(`Error during ${method} request to ${url}:`, error);
            alert(`Error: ${error.message}`);
            throw error; // Re-throw to be caught by specific functions if needed
        }
    }

    async function fetchTodos() {
        try {
            const todos = await fetchData(API_URL);
            displayTodos(todos);
        } catch (error) {
            todoListElement.innerHTML = '<li class="error">Failed to load todos.</li>';
        }
    }

    function displayTodos(todos) {
        todoListElement.innerHTML = '';
        todos.forEach(todo => {
            const listItem = createTodoListItem(todo);
            todoListElement.appendChild(listItem);
        });
    }

    function createTodoListItem(todo) {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span class="${todo.completed ? 'completed' : ''}">
                <strong>${todo.title}</strong>: ${todo.description || 'No description'}
            </span>
            <div class="actions">
                <button class="complete-button" data-id="${todo.id}">${todo.completed ? 'Uncomplete' : 'Complete'}</button>
                <button class="edit-button" data-id="${todo.id}">Edit</button>
                <button class="delete-button" data-id="${todo.id}">Delete</button>
            </div>
            <div class="edit-form" id="edit-form-${todo.id}" style="display:none;">
                <input type="text" class="edit-title" value="${todo.title}">
                <input type="text" class="edit-description" value="${todo.description}">
                <button class="save-button" data-id="${todo.id}">Save</button>
                <button class="cancel-button" data-id="${todo.id}">Cancel</button>
            </div>
        `;
        return listItem;
    }

    addTodoButton.addEventListener('click', async () => {
        const title = newTodoTitleInput.value.trim();
        const description = newTodoDescriptionInput.value.trim();
        if (title) {
            try {
                await fetchData(API_URL, 'POST', JSON.stringify({ title, description, completed: false }));
                fetchTodos();
                newTodoTitleInput.value = '';
                newTodoDescriptionInput.value = '';
            } catch (error) {
                // Error is already handled by fetchData
            }
        } else {
            alert('Title cannot be empty.');
        }
    });

    todoListElement.addEventListener('click', async (event) => {
        const target = event.target;
        const id = parseInt(target.dataset.id);
        const listItem = target.closest('li');

        if (target.classList.contains('complete-button')) {
            const isCompleted = listItem.querySelector('span').classList.contains('completed');
            const title = listItem.querySelector('strong').textContent;
            try {
                await fetchData(`${API_URL}${id}`, 'PUT', JSON.stringify({ title, completed: !isCompleted }));
                fetchTodos();
            } catch (error) {
                // Error is already handled by fetchData
            }
        } else if (target.classList.contains('delete-button')) {
            try {
                await fetchData(`${API_URL}${id}`, 'DELETE');
                fetchTodos();
            } catch (error) {
                // Error is already handled by fetchData
            }
        } else if (target.classList.contains('edit-button')) {
            const editForm = document.getElementById(`edit-form-${id}`);
            const actionsDiv = target.parentNode;
            editForm.style.display = 'block';
            actionsDiv.style.display = 'none';
        } else if (target.classList.contains('cancel-button')) {
            const id = target.dataset.id;
            const editForm = document.getElementById(`edit-form-${id}`);
            const actionsDiv = editForm.previousElementSibling;
            editForm.style.display = 'none';
            actionsDiv.style.display = 'flex';
        } else if (target.classList.contains('save-button')) {
            const id = parseInt(target.dataset.id);
            const editForm = target.closest('.edit-form');
            const titleInput = editForm.querySelector('.edit-title');
            const descriptionInput = editForm.querySelector('.edit-description');
            try {
                await fetchData(`${API_URL}${id}`, 'PUT', JSON.stringify({ title: titleInput.value, description: descriptionInput.value }));
                fetchTodos();
                editForm.style.display = 'none';
                editForm.previousElementSibling.style.display = 'flex';
            } catch (error) {
                // Error is already handled by fetchData
            }
        }
    });

    fetchTodos();
});