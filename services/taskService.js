const fs = require('fs-extra');
const path = require('path');

const DATA_PATH = path.join(__dirname, ".." ,'data', 'tasks.json')

async function handleGetAllTasks(){
    return await fs.readJson(DATA_PATH);
}


async function handleAddNewTask(req){
    const tasks = await handleGetAllTasks();
    tasks.push(req.body);
    await fs.writeJson(DATA_PATH, tasks)
}

async function handleDeleteTask(req){
    let tasks = await handleGetAllTasks();
    tasks = tasks.filter(task => task.id !== req.params.id);
    await fs.writeJson(DATA_PATH, tasks)
}


module.exports = {handleGetAllTasks, handleAddNewTask, handleDeleteTask}

