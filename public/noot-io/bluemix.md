# Deploying Noot.io to IBM Cloud (formerly Bluemix)

This guide will walk you through the process of deploying the Noot.io game to IBM Cloud for multiplayer functionality.

## Prerequisites

1. An [IBM Cloud account](https://cloud.ibm.com/registration)
2. [IBM Cloud CLI](https://cloud.ibm.com/docs/cli) installed
3. [Git](https://git-scm.com/downloads) installed
4. Node.js and npm installed

## Step 1: Prepare Your Project

First, make sure your Noot.io game files are properly structured:

1. Create a new directory for your IBM Cloud deployment
2. Copy the following files from your existing Noot.io game:
   - `server.js` (the main server file)
   - `package.json` (dependencies)
   - `public/` directory (containing all client-side files)

## Step 2: Create a manifest.yml File

Create a `manifest.yml` file in your project root with the following content:

```yaml
applications:
- name: noot-io-game
  memory: 256M
  instances: 1
  random-route: true
  buildpack: nodejs_buildpack
  command: node server.js
```

You can adjust the memory and instances based on your needs.

## Step 3: Login to IBM Cloud

Open your terminal and login to IBM Cloud:

```bash
ibmcloud login
```

If you're using a federated ID, use:

```bash
ibmcloud login --sso
```

## Step 4: Target a Cloud Foundry Org and Space

```bash
ibmcloud target --cf
```

This command will prompt you to select an organization and space.

## Step 5: Deploy Your Application

```bash
ibmcloud cf push
```

This command will read your `manifest.yml` file and deploy your application to IBM Cloud.

## Step 6: Access Your Application

After deployment, the CLI will display your app's URL. You can also find it in the IBM Cloud dashboard.

```bash
ibmcloud cf apps
```

Look for your app name and note the associated URL.

## Step 7: Update Your Client Code

Now that your multiplayer server is running on IBM Cloud, update your client code to connect to it. Modify your client's Socket.IO connection in `public/noot-io/js/app.js`:

```javascript
// Replace:
const socket = io();

// With:
const socket = io('https://your-app-url.mybluemix.net');
```

Replace `your-app-url` with your actual IBM Cloud app URL.

## Step 8: Monitor Your Application

You can monitor your application's logs with:

```bash
ibmcloud cf logs noot-io-game --recent
```

For continuous log monitoring:

```bash
ibmcloud cf logs noot-io-game
```

## Step 9: Scale Your Application (Optional)

If your game becomes popular, you may need to scale:

```bash
# Increase memory
ibmcloud cf scale noot-io-game -m 512M

# Increase instances
ibmcloud cf scale noot-io-game -i 2
```

## Step 10: Set Environment Variables (Optional)

If your application requires environment variables:

```bash
ibmcloud cf set-env noot-io-game MY_VARIABLE my_value
```

After setting environment variables, restart your application:

```bash
ibmcloud cf restart noot-io-game
```

## Important Notes

1. The free tier on IBM Cloud has limitations on usage. Check the current pricing and free tier details on the IBM Cloud website.
2. Applications on the free tier may be put to sleep after periods of inactivity.
3. For a production game, consider implementing additional security measures and optimizations.

## Troubleshooting

If you encounter any issues:

1. Check your application logs as shown above
2. Verify your application's health in the IBM Cloud dashboard
3. Make sure your Socket.IO version in the client matches the server
4. Check for any CORS issues if connecting from a different domain

## Enjoy Your Multiplayer Game!

That's it! Your Noot.io game should now be running on IBM Cloud with multiplayer functionality. Players can access it via your IBM Cloud app URL. 