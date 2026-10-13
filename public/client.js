async function getTasks() {
    const res = await fetch('/api/tasks');
    if (!res.ok) throw new Error('Kunne ikke hente opgaver.');
    const tasks = await res.json();
    const list = document.getElementById('taskList');
    list.innerHTML = '';

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        const name = document.createElement('span');
        name.textContent = task.name;
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-danger btn-sm';
        deleteButton.textContent = '🗑️';
        deleteButton.onclick = () => run(() => deleteTask(task.id));
        li.append(name, deleteButton);
        list.appendChild(li);
    });
}

async function addTask() {
    const input = document.getElementById('newTask');
    const name = input.value.trim();
    if (!name) return;

    const newTask = { id: crypto.randomUUID(), name}
    const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(newTask)
    });
    if (!res.ok) throw new Error('Kunne ikke tilføje opgaven.');
    input.value = '';
    await getTasks();
}

async function deleteTask(id) {
    const res = await fetch(`/api/tasks/${encodeURIComponent(id)}`, {method: 'DELETE'});
    if (!res.ok) throw new Error('Kunne ikke slette opgaven.');
    await getTasks();
}

function showError(error) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = error instanceof Error ? error.message : 'Der opstod en fejl.';
    errorMessage.classList.remove('d-none');
}

async function run(action) {
    document.getElementById('errorMessage').classList.add('d-none');
    try {
        await action();
    } catch (error) {
        showError(error);
    }
}

document.getElementById('addBtn').addEventListener('click', () => run(addTask));
window.addEventListener('load', () => run(getTasks));