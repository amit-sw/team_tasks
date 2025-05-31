# Render.com Deployment Guide for Team Tasks Application

This guide provides instructions for deploying the Team Tasks application to Render.com using a local build approach to avoid memory constraints.

## Deployment Strategy

We use a "build locally, deploy pre-built assets" approach to:
1. Avoid memory constraints on Render's free tier
2. Speed up deployment times
3. Ensure consistent builds

## Prerequisites

- Node.js and npm installed locally
- Git repository with your code
- Render.com account
- Required environment variables (API keys, secrets, etc.)

## Deployment Process

### Step 1: Build Locally

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd team-tasks
   ```

2. Install dependencies:
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

3. Build the client application:
   ```bash
   npm run build
   ```
   This creates an optimized production build in the `build` directory.

### Step 2: Configure Render Services

#### Client Service (Frontend)

1. In the Render dashboard, create or select your client service (team-tasks-client)
2. Configure the following settings:
   - **Build Command**: `echo "Using pre-built assets"`
   - **Start Command**: `npx serve -s build -l $PORT`
   - **Environment Variables**: 
     - `NODE_ENV=production`

#### Server Service (Backend)

1. In the Render dashboard, create or select your server service (team-tasks-server)
2. Configure the following settings:
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Environment Variables**:
     - `NODE_ENV=production`
     - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (for OAuth)
     - `GOOGLE_REDIRECT_URI` (set to `https://team-tasks-server.onrender.com/api/auth/google/callback`)
     - `JWT_SECRET` (for authentication)
     - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`
     - Any other required API keys from your .env file
     - **NOTE**: Do NOT set `PORT` - Render will assign this automatically

### Step 3: Deploy

1. Commit and push your changes to GitHub:
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push
   ```

2. In the Render dashboard, deploy both services:
   - Go to each service
   - Click "Manual Deploy" > "Deploy latest commit"
   - Wait for the deployment to complete

### Step 4: Verify Deployment

1. Check the deployment logs for any errors
2. Verify the client application at: `https://team-tasks-client.onrender.com`
3. Verify the server API at: `https://team-tasks-server.onrender.com/health`

## Troubleshooting

### CORS Issues
If you encounter CORS issues:
- Verify the CORS configuration in `server/index.js`
- Ensure the client domain is properly allowed in the CORS settings
- Check that the authentication flow is using the direct redirect approach in production

### Authentication Issues
If authentication fails:
- Verify the Google OAuth configuration in Google Cloud Console
- Ensure the redirect URI is correctly set to `https://team-tasks-server.onrender.com/api/auth/google/callback`
- Check the JWT secret is properly set in environment variables

### Memory Issues
If you still encounter memory issues:
- Ensure you're using the local build approach described in this guide
- Verify the server's memory allocation is set to an appropriate value in `package.json`
- Consider optimizing your application to reduce memory usage

## Maintenance

### Updating the Application
To update your deployed application:
1. Make changes to your code locally
2. Test thoroughly
3. Build locally: `npm run build`
4. Commit and push to GitHub
5. Deploy the latest commit on Render

### Monitoring
Render provides basic monitoring and logs:
- Check service health in the Render dashboard
- Review logs for errors or performance issues
- Set up alerts for service outages if needed
