const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

const DATA_PATH = path.join(__dirname, '..', 'data', 'tasks.json');

// Mutex / asynkron kø til at forhindre race conditions og filkollisioner ved samtidige kald
let fileLock = Promise.resolve();

function withFileLock(operation) {
    const next = fileLock.then(() => operation());
    fileLock = next.catch(() => {}); // Sikrer at en fejl ikke blokerer fremtidige anmodninger i køen
    return next;
}

async function readTasksFromFile() {
    const exists = await fs.pathExists(DATA_PATH);
    if (!exists) {
        await fs.ensureFile(DATA_PATH);
        await fs.writeJson(DATA_PATH, []);
        return [];
    }
    const tasks = await fs.readJson(DATA_PATH);
    return Array.isArray(tasks) ? tasks : [];
}

async function handleGetAllTasks() {
    return withFileLock(async () => {
        return await readTasksFromFile();
    });
}

async function handleAddNewTask(req) {
    const { name } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
        const error = new Error('Opgavenavn er påkrævet og må ikke være tomt.');
        error.statusCode = 400;
        throw error;
    }

    return withFileLock(async () => {
        const tasks = await readTasksFromFile();
        const newTask = {
            id: req.body.id || (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()),
            name: name.trim()
        };

        tasks.push(newTask);
        await fs.writeJson(DATA_PATH, tasks, { spaces: 2 });
        return newTask;
    });
}

async function handleDeleteTask(req) {
    const id = req.params?.id;
    if (!id || typeof id !== 'string' || !id.trim()) {
        const error = new Error('Opgave-ID mangler eller er ugyldigt.');
        error.statusCode = 400;
        throw error;
    }

    return withFileLock(async () => {
        let tasks = await readTasksFromFile();
        const initialLength = tasks.length;
        tasks = tasks.filter(task => task.id !== id);

        if (tasks.length === initialLength) {
            const error = new Error('Opgaven blev ikke fundet.');
            error.statusCode = 404;
            throw error;
        }

        await fs.writeJson(DATA_PATH, tasks, { spaces: 2 });
    });
}

module.exports = { handleGetAllTasks, handleAddNewTask, handleDeleteTask };
