const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 10002;
const DATA_FILE = path.join(__dirname, 'tasks.json');

// 提供静态文件服务
app.use(express.static(__dirname));

app.use(cors());
app.use(express.json());

// 读取任务数据
async function readTasks() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// 保存任务数据
async function saveTasks(tasks) {
  await fs.writeFile(DATA_FILE, JSON.stringify(tasks, null, 2), 'utf8');
}

// 获取所有任务
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await readTasks();
    res.json({ success: true, tasks });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// 添加任务
app.post('/api/tasks', async (req, res) => {
  try {
    const tasks = await readTasks();
    const newTask = {
      id: Date.now(),
      title: req.body.title,
      description: req.body.description || '',
      assignee: req.body.assignee || '',
      status: req.body.status || 'todo',
      createdBy: req.body.createdBy || '匿名',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    tasks.push(newTask);
    await saveTasks(tasks);
    res.json({ success: true, task: newTask });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// 更新任务状态
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const tasks = await readTasks();
    const taskIndex = tasks.findIndex(t => t.id === parseInt(req.params.id));
    
    if (taskIndex === -1) {
      return res.json({ success: false, message: 'Task not found' });
    }
    
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    await saveTasks(tasks);
    res.json({ success: true, task: tasks[taskIndex] });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// 删除任务
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const tasks = await readTasks();
    const newTasks = tasks.filter(t => t.id !== parseInt(req.params.id));
    await saveTasks(newTasks);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// 批量更新任务状态
app.post('/api/tasks/bulk', async (req, res) => {
  try {
    const tasks = await readTasks();
    const { updates } = req.body;
    
    updates.forEach(update => {
      const taskIndex = tasks.findIndex(t => t.id === update.id);
      if (taskIndex !== -1) {
        tasks[taskIndex] = {
          ...tasks[taskIndex],
          ...update,
          updatedAt: new Date().toISOString()
        };
      }
    });
    
    await saveTasks(tasks);
    res.json({ success: true, tasks });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// 获取统计信息
app.get('/api/stats', async (req, res) => {
  try {
    const tasks = await readTasks();
    const stats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      progress: tasks.filter(t => t.status === 'progress').length,
      done: tasks.filter(t => t.status === 'done').length
    };
    res.json({ success: true, stats });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Kanban Board API running on port ${PORT}`);
});
