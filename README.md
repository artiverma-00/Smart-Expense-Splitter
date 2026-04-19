# Smart Expense Splitter

A group expense tracking app built with Next.js App Router, MongoDB, JWT auth, and AI-assisted categorization/insights.

## Features

- User registration and login
- Create groups and add/remove members
- Add expenses with equal or custom split
- Live per-person split preview
- Group balances and settlement flow
- Group chat with unread count, delete message, and seen-by status
- AI expense category and spending insights (with graceful fallback)

## Tech Stack

- Next.js 16 (App Router)
- React
- Tailwind CSS
- MongoDB + Mongoose
- Zustand (auth state)
- Axios
- Sonner (toasts)

## Prerequisites

- Node.js 18.18+ (Node.js 20+ recommended)
- npm
- MongoDB Atlas or local MongoDB

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Environment Variables

Create a file named `.env.local` in the project root:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
GEMINI_API_KEY=your_gemini_api_key_optional
```

Notes:

- `MONGODB_URI` and `JWT_SECRET` are required.
- `GEMINI_API_KEY` is optional. Without it, AI routes use safe fallback logic.
- If auth APIs return 500 locally, check your MongoDB Atlas network access/IP whitelist first.

## 3. Run the App

```bash
npm run dev
```

Open:

- http://localhost:3000

## 4. Build and Start (Production Mode)

```bash
npm run build
npm start
```

## How to Use

### Create Account and Login

1. Open `/register` and create an account.
2. Login from `/login`.

### Create a Group

1. Go to `Groups`.
2. Click `New Group`.
3. Enter group name and optional description.

### Add Members

1. Open a group.
2. Click `Add People`.
3. Enter the email of an existing registered user.

### Add Expense

1. Open a group.
2. Click `Add Expense`.
3. Enter title, amount, category, split type.
4. For custom split, set per-member amounts so total equals expense amount.

### Settle Balances

1. Open the `Balances` tab in a group.
2. Use `Settle` for transactions you owe.

### Use Group Chat

1. Open a group and go to the `Chat` tab.
2. Send messages with the input box.
3. Unread count appears on the chat tab when there are unseen messages.
4. Your message can show `Seen by N` when group members have seen it.

## Common Issues

### `npm run dev` fails

Run:

```bash
npm install
npm run dev
```

If it still fails, check terminal output for the first error and verify:

- Node.js version is supported
- `.env.local` exists and has valid values
- MongoDB connection string is reachable

### Auth API (`/api/auth/register` or `/api/auth/login`) returns 500

Usually MongoDB access issue:

- Atlas cluster paused/offline
- Current IP not whitelisted
- Invalid `MONGODB_URI`

## Scripts

- `npm run dev` - start development server
- `npm run build` - create production build
- `npm start` - run production server
- `npm run lint` - run lint checks

## Project Structure (High Level)

- `src/app` - app routes and API routes
- `src/components` - UI and feature components
- `src/hooks` - shared hooks for auth/groups/expenses
- `src/models` - Mongoose models
- `src/lib` - database, auth, AI, utility helpers
