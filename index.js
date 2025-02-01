require("dotenv").config();
const axios = require("axios");
const fs = require("fs");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
// const TELEGRAM_MESSAGE_THREAD_ID = process.env.TELEGRAM_MESSAGE_THREAD_ID;  // Optional, if using topics
const ASANA_PAT = process.env.ASANA_PAT;
const ASANA_PROJECT_ID = process.env.ASANA_PROJECT_ID;
const POLLING_INTERVAL = process.env.POLLING_INTERVAL || 30;

const MESSAGE_STORE_FILE = "messages.json";

let previousTasks = new Map();
loadStoredMessages();

// 📌 Tasks check function
async function checkTasks() {
    try {
        const response = await axios.get(`https://app.asana.com/api/1.0/projects/${ASANA_PROJECT_ID}/tasks`, {
            headers: { Authorization: `Bearer ${ASANA_PAT}` }
        });

        const tasks = response.data.data || [];

        for (const task of tasks) {
            const taskData = await getTaskDetails(task.gid);
            if (!taskData) continue;

            const existingTask = previousTasks.get(task.gid);

            if (!existingTask) {
                // 🆕 New task - sending a message
                const messageId = await sendTelegramMessage(taskData);
                previousTasks.set(task.gid, { ...taskData, messageId });
            } else if (
                existingTask.name !== taskData.name || 
                existingTask.notes !== taskData.notes || 
                existingTask.assignee !== taskData.assignee || 
                existingTask.due_on !== taskData.due_on || 
                existingTask.priority !== taskData.priority
            ) {
                // ✏️ The task has been changed - editing the message
                await editTelegramMessage(existingTask.messageId, taskData);
                previousTasks.set(task.gid, { ...taskData, messageId: existingTask.messageId });
            }
        }

        saveStoredMessages();
    } catch (error) {
        console.error("❌ Error getting tasks:", error.response?.data || error.message);
    }
}

// 🔍 Get task details
async function getTaskDetails(taskId) {
  try {
      const response = await axios.get(`https://app.asana.com/api/1.0/tasks/${taskId}?opt_fields=name,notes,assignee.name,due_on,custom_fields,permalink_url`, {
          headers: { Authorization: `Bearer ${ASANA_PAT}` }
      });

      const task = response.data.data;

      return {
          gid: task.gid,
          name: task.name,
          notes: formatDescription(task.notes) || "No description",
          assignee: task.assignee ? task.assignee.name : "Not assigned",
          due_on: task.due_on || "Not specified",
          permalink_url: task.permalink_url
      };
  } catch (error) {
      console.error("❌ Error getting task details:", error.response?.data || error.message);
      return null;
  }
}

// 📢 Sending a new message in Telegram
async function sendTelegramMessage(task) {
    if (!task) return;

    const message = formatTaskMessage(task);

    try {
        const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            // message_thread_id: TELEGRAM_MESSAGE_THREAD_ID, // Optional, if using topics
            text: message,
            parse_mode: "Markdown"
        });

        return response.data.result.message_id;
    } catch (error) {
        console.error("❌ Error sending to Telegram:", error.response?.data || error.message);
        return null;
    }
}

// ✏️ Editing an existing message
async function editTelegramMessage(messageId, task) {
    if (!messageId || !task) return;

    const newMessage = formatTaskMessage(task);

    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
            chat_id: TELEGRAM_CHAT_ID,
            message_id: messageId,
            text: newMessage,
            parse_mode: "Markdown"
        });
    } catch (error) {
        console.error("❌ Error editing a message in Telegram:", error.response?.data || error.message);
    }
}

// 📄 Formatting messages for Telegram
function formatTaskMessage(task) {
    return `*Task in Asana*\n\n`
        + `📌 *Name*: ${task.name}\n`
        + `📃 *Description*: ${task.notes}\n`
        + `👤 *Assignee*: ${task.assignee}\n`
        + `📅 *Due date*: ${task.due_on}\n\n`
        + `🔗 [Open in Asana](${task.permalink_url})`;
}

// 📂 Saving and loading messages from a file
function saveStoredMessages() {
    fs.writeFileSync(MESSAGE_STORE_FILE, JSON.stringify(Array.from(previousTasks.entries()), null, 2));
}

function loadStoredMessages() {
    if (fs.existsSync(MESSAGE_STORE_FILE)) {
        const data = JSON.parse(fs.readFileSync(MESSAGE_STORE_FILE));
        previousTasks = new Map(data);
    }
}

function formatDescription(text) {
    return text.replace(/https:\/\/app\.asana\.com\/app\/asana\/-\/get_asset\?asset_id=[^\s]+/g, '') // Remove Asana asset links
    .replace(/\u00A0/g, ' ')  // Replace non-breaking spaces with normal spaces
    .replace(/\s+/g, ' ')     // Replace multiple spaces/newlines with a single space
    .trim();                  // Remove leading/trailing spaces
  }

// ⏳ Start polling
console.log(`🚀 Polling started (every ${POLLING_INTERVAL} seconds)`);
setInterval(checkTasks, POLLING_INTERVAL * 1000);