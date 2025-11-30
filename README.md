# Storify

A simple and modern file storage application built with **Next.js**, **Clerk**, **Neon PostgreSQL**, **Drizzle ORM**, **ImageKit**, and **shadcn/ui**.

---

## 📌 About Storify

**Storify** is a lightweight cloud storage platform designed to make file management effortless.  
Upload, organize, star, or trash your files in a clean and responsive interface powered by shadcn/ui.

Built with a modern tech stack — **Next.js**, **Clerk**, **Neon**, **Drizzle**, and **ImageKit** — Storify provides a secure and elegant alternative to heavy file-storage apps like Google Drive and Dropbox.  
Whether you're a developer, student, or everyday user, Storify gives you fast, safe, and minimalistic file storage without the clutter.

---

## 🚀 Features

- 🔐 User authentication with Clerk  
- 📤 File uploads with ImageKit  
- 🗂 File management (star, trash)  
- 💾 Persistent storage using Neon PostgreSQL + Drizzle  
- 🎨 Beautiful and responsive UI with Tailwind CSS + shadcn/ui  
- ⚡ Modern architecture with Next.js App Router  
- 🔒 Secure server-side routing & API handling  

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js, React, Tailwind CSS, shadcn/ui |
| Authentication | Clerk |
| Database | Neon PostgreSQL |
| ORM | Drizzle |
| File Storage | ImageKit |
| Deployment | Vercel (recommended) |

---

## 📥 Getting Started

### ✅ Prerequisites

Make sure you have:

- Node.js 18+  
- Clerk account  
- Neon PostgreSQL database  
- ImageKit account  

---

## 📦 Installation

### 1️⃣ Clone the Repository

git clone https://github.com/yourusername/storify.git
cd storify
### 2️⃣ Install Dependencies
npm install
# or
yarn install
# or
pnpm install

### 3️⃣ Create .env.local File
Create a .env.local in the root directory and add:

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# ImageKit
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Fallback URLs
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database - Neon PostgreSQL
DATABASE_URL=your_neon_database_url
4️⃣ Set Up Accounts & Keys
Get your Clerk publishable & secret keys

Create a Neon PostgreSQL database & copy connection string

Create an ImageKit project & get public/private key + URL endpoint

▶️ Running the Application
Start Development Server
bash
Copy code
npm run dev
# or
yarn dev
# or
pnpm dev
Visit:

arduino
Copy code
http://localhost:3000
🏗 Building for Production
Build the App
bash
Copy code
npm run build
# or
yarn build
# or
pnpm build
Start Production Server
bash
Copy code
npm start
# or
yarn start
# or
pnpm start
