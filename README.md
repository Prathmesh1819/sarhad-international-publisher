# Sarhad International Publisher

Sarhad International Publisher is a responsive college-level academic publishing web application. It lets students register, submit articles with public PDF links, track review status, and lets admins approve, reject, and publish research papers.

## Project Structure

```text
Sarhad international publisher/
├── index.html
├── about.html
├── submit.html
├── publications.html
├── admin.html
├── auth.html
├── contact.html
├── style.css
├── script.js
├── firebase-config.js
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
└── README.md
```

## Features

- Student/author registration and login with Firebase Authentication
- Article submission with title, category, description, and public PDF link
- Personal dashboard for tracking submission status
- Admin dashboard for review, approval, rejection, remarks, and publishing
- Public publication archive with search, category filter, PDF read/download actions
- Bonus features:
  - Download count
  - Top authors section
  - Certificate generation for approved submissions

## Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
2. Enable:
   - Authentication with Email/Password
   - Firestore Database
3. Open `firebase-config.js`.
4. Replace the placeholder values with your Firebase project keys.
5. Deploy the included Firestore rules if you are using Firebase CLI.

Example:

```js
const firebaseConfig = {
  apiKey: "your-real-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-messaging-id",
  appId: "your-app-id"
};
```

## Firestore Collections

### `users`

Each registered user gets a document with:

```text
name
department
email
role
createdAt
```

Default role is `author`.

To make an admin:

1. Register normally.
2. Go to Firestore.
3. Open the user's document in the `users` collection.
4. Change `role` from `author` to `admin`.

### `submissions`

Each submitted article stores:

```text
title
category
description
pdfLink
fileUrl
status
remarks
isPublished
downloadCount
authorId
authorName
authorDepartment
authorEmail
createdAt
publishedAt
```

## Firestore Security Rules
This project already includes [firestore.rules](/Users/prathmeshpramoddharashivkar/Documents/Sarhad%20international%20publisher/firestore.rules) and [firestore.indexes.json](/Users/prathmeshpramoddharashivkar/Documents/Sarhad%20international%20publisher/firestore.indexes.json).

```text
firebase deploy --only firestore
```

## How To Run

Because this project uses JavaScript modules, do not open the HTML files directly with `file://`.

Use a simple local server:

### Option 1: VS Code Live Server

1. Open the folder in VS Code.
2. Install the Live Server extension.
3. Right-click `index.html`.
4. Click `Open with Live Server`.

### Option 2: Python local server

Run this in the project folder:

```bash
python3 -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

## Official Password Reset Email Setup

To send password reset emails from your official email address, this project now includes a backend mail service.

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file from `.env.example`.

3. Add your official email SMTP details in `.env`.

4. Download a Firebase service account key from Firebase Console and save it in the project folder as:

```text
serviceAccountKey.json
```

5. Start the backend API:

```bash
npm run start:api
```

6. Keep your frontend running on:

```text
http://localhost:5500
```

The `Reset Password` button will then call the backend and send the email from your configured official address.

## GitHub + Vercel Deployment

This project can be deployed from GitHub to Vercel.

Before pushing to GitHub:

1. Make sure `.gitignore` is present so these files are not uploaded:
   - `.env`
   - `serviceAccountKey.json`
   - `node_modules`
2. Push the project to a GitHub repository.
3. Import that repository into Vercel.
4. In Vercel project settings, add the same environment variables from your local `.env`.
5. For Firebase Admin in Vercel, add `FIREBASE_SERVICE_ACCOUNT_JSON` and paste the full service account JSON as a single-line string.

After deployment:

- Static pages will be served by Vercel
- Password reset will run through the Vercel serverless endpoint at `/api/auth/reset-password`

## Beginner Notes

- If Firebase is not configured, the website still shows demo content.
- Once Firebase keys are added, the live authentication, submission, and admin workflows become active.
- Admin dashboard access depends on the `role: "admin"` field in Firestore.
- To show your real college logo, place the image at `assets/sarhad-logo.png`.
- Readers open article PDFs using the public links submitted by authors.

## Future Improvements

- Add email notifications for approval or rejection
- Add author profile images
- Add richer peer review stages
- Add pagination for large publication archives
