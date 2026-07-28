# FinBot AI - Personal Finance Telegram Bot

AI-Powered Personal Finance Advisor for Telegram

## Project Overview

FinBot AI is an intelligent Telegram bot that helps users track finances through natural conversation.

### Key Features
✅ Natural language expense tracking
✅ Income logging
✅ Monthly reports
✅ Budget planning
✅ Financial goal tracking
✅ AI-powered affordability analysis (Phase 2)

## Project Structure
finbot-ai/
├── backend/ (Node.js + Express + MongoDB)
│ ├── src/
│ │ ├── config/
│ │ ├── models/
│ │ ├── handlers/
│ │ ├── utils/
│ │ └── index.js
│ ├── .env
│ ├── package.json
│ └── README.md
├── frontend/ (Coming Phase 2 - React Dashboard)
└── README.md

## Quick Start

### Backend Setup
```powershell
cd backend
npm install
# Create .env with API keys
npm run dev
```

Bot will start on `http://localhost:3000`

## Tech Stack

**Backend:**
- Node.js
- Express.js
- MongoDB + Mongoose
- Telegraf (Telegram Bot)
- Dotenv

**Frontend (Phase 2):**
- React.js
- Tailwind CSS
- Axios

## Phases

### Phase 0 (Current) ✅
- Basic project setup
- User profiles
- Expense/Income tracking
- Setup flow
- Command handlers

### Phase 1 (Next)
- Monthly reports
- Budget planning
- Goal tracking
- Analytics
- Category detection with AI

### Phase 2
- Affordability analysis
- Web dashboard
- Premium features
- Freemium model

### Phase 3+
- Mobile app
- Receipt OCR
- Bank statement integration
- Investment tracking

## API Endpoints

- `GET /health` - Check bot status

## Telegram Commands

- `/start` - Initialize bot
- `/help` - Show commands
- `/setup` - Configure profile
- `/summary` - Quick summary
- `/report` - Monthly report (Phase 1)
- `/budget` - Budget planning (Phase 1)

## Requirements

- Node.js 18+
- MongoDB Atlas (free tier)
- Telegram Bot Token

## Getting Bot Token

1. Message @BotFather on Telegram
2. Send `/newbot`
3. Choose name & username
4. Copy token

## Contributing

Phase 1 tasks:
- [ ] Report generation
- [ ] Budget planning
- [ ] Goal tracking
- [ ] AI category detection



## Author

Abhi0605