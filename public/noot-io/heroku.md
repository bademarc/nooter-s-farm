# Deploying Noot.io to Heroku

This guide will walk you through the process of deploying the Noot.io game to Heroku for multiplayer functionality.

## Prerequisites

1. A [Heroku account](https://signup.heroku.com/)
2. [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed
3. [Git](https://git-scm.com/downloads) installed
4. Node.js and npm installed

## Step 1: Prepare Your Project

First, make sure your Noot.io game files are properly structured:

1. Create a new directory for your Heroku deployment
2. Copy the following files from your existing Noot.io game:
   - `server.js` (the main server file)
   - `package.json` (dependencies)
   - `public/` directory (containing all client-side files)

## Step 2: Initialize Git Repository

Navigate to your project directory and initialize a Git repository:

```bash
cd noot-io
git init
```

## Step 3: Create a Heroku App

Create a new Heroku app:

```bash
heroku login
heroku create noot-io-game
```

This command will create a new Heroku app with the name `noot-io-game` (or choose a different unique name).

## Step 4: Prepare for Deployment

1. Create a `.gitignore` file with the following content:

```
node_modules
npm-debug.log
.DS_Store
```

2. Add a `Procfile` (without any file extension) with the following content:

```
web: node server.js
```

## Step 5: Commit and Deploy

Commit your files and deploy to Heroku:

```bash
git add .
git commit -m "Initial commit for Noot.io"
git push heroku master
```

## Step 6: Open Your Deployed App

Once the deployment is complete, you can open your app with the following command:

```bash
heroku open
```

This will open your browser to your deployed Noot.io game!

## Step 7: Update Your Client Code

Now that your multiplayer server is running on Heroku, you need to update your client code to connect to it. Modify your client's Socket.IO connection in `public/noot-io/js/app.js`:

```javascript
// Replace:
const socket = io();

// With:
const socket = io('https://your-app-name.herokuapp.com');
```

Replace `your-app-name` with your actual Heroku app name.

## Step 8: Setting Environment Variables (Optional)

If you need to set environment variables for your app:

```bash
heroku config:set MY_VARIABLE=my_value
```

## Troubleshooting

If you encounter any issues, check the logs:

```bash
heroku logs --tail
```

## Scaling (Optional)

For a small game, a single dyno is enough:

```bash
heroku ps:scale web=1
```

For more players, you might need to scale up:

```bash
heroku ps:scale web=2
```

Note that additional dynos will incur charges.

## Important Notes

1. Heroku apps go to sleep after 30 minutes of inactivity when using the free tier. Consider upgrading to a paid plan for continuous availability.
2. Free tier has a limit of 1000 hours per month across all your apps.
3. For a production game, consider implementing additional security measures and optimizations.

## Enjoy Your Multiplayer Game!

That's it! Your Noot.io game should now be running on Heroku with multiplayer functionality. Players can access it via your Heroku app URL. 