const fs = require('fs-extra');
const path = require('path');

const DATA_PATH = path.join(__dirname, ".." ,'data', 'tasks.json')

let fileQueue = Promise.resolve();

function withFileQueue(operation) {
    const result = fileQueue.then(operation);
    fileQueue = result.catch(() => {});
    return result;
}

function readTasksFromDisk() {
    return fs.readJson(DATA_PATH);
}

function writeTasksToDisk(tasks) {
    return fs.writeJson(DATA_PATH, tasks);
}

function handleGetAllTasks() {
    return withFileQueue(() => readTasksFromDisk());
}

function handleAddNewTask(req) {
    return withFileQueue(async () => {
        const tasks = await readTasksFromDisk();
        tasks.push(req.body);
        await writeTasksToDisk(tasks);
    });
}

function handleDeleteTask(req) {
    return withFileQueue(async () => {
        const tasks = await readTasksFromDisk();
        const remainingTasks = tasks.filter(task => task.id !== req.params.id);
        await writeTasksToDisk(remainingTasks);
    });
}


module.exports = {handleGetAllTasks, handleAddNewTask, handleDeleteTask}
