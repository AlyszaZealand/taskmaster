async function getTasks() {
    const res = await fetch('/api/tasks');
    const task = await res.json();
    const list = document.getElementById('taskList');
    list.innerHTML = '';

    task.forEach(task => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
        <span>${task.title}</span>
        <button class="btn btn-danger btn-sm">🗑️</button>
        `;
        li.querySelector('button').onclick =  () => deleteTask(task.id);
        list.appendChild(li)
    })
}

async function addTask() {
    const input = document.getElementById('newTask');
    const name = input.value.trim();
    if (!name) return;

    const newTask = { id: crypto.randomUUID(), title: name}
    await fetch('/api/tasks', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify( newTask )
    });
    input.value = '';
    await getTasks();
}

async function deleteTask(id) {
    await fetch(`/api/tasks/${id}`, {method: 'DELETE'});
    await getTasks();
}

//Nok også i controller
document.getElementById('addBtn').addEventListener('click', addTask);
window.onload = getTasks;

