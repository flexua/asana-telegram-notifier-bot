# Asana to Telegram Bot

This Node.js script periodically checks for new or updated tasks in an Asana project and sends notifications to a Telegram chat.

## 🚀 Features

- Detects new tasks in Asana and sends a message to Telegram.

- Updates messages when a task's name, description, assignee, or due date changes.

- Provides task details: name, description, assignee, due date, and a direct link to the Asana task.

- Uses polling instead of webhooks to fetch tasks at regular intervals.

## 📦 Installation

1️⃣ Clone the repository

```
git clone https://github.com/flexua/asana-telegram-notifier-bot.git
cd asana-telegram-bot
```

2️⃣ Install dependencies

```
npm install
```

3️⃣ Create a .env file

Create a .env file in the root directory and fill in the required values:

```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
TELEGRAM_MESSAGE_THREAD_ID=your_thread_id  # Optional, if using topics
ASANA_PAT=your_asana_personal_access_token
ASANA_PROJECT_ID=your_asana_project_id
POLLING_INTERVAL=30  # Time in seconds
```

## ▶️ Usage

Run the bot with:
```
node index.js
```
## ⚙️ How It Works

The bot fetches all tasks from the specified Asana project every POLLING_INTERVAL seconds.

If a new task is detected, it sends a message to the Telegram chat.

If an existing task is updated (name, description, assignee, or due date), the corresponding Telegram message is edited.

All sent messages are stored in a file (messages.json) to track changes.

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/flexua/asana-telegram-notifier-bot?tab=MIT-1-ov-file) file for details.

## Authors

- FlexDevUA [@flexua](https://www.github.com/flexua)


