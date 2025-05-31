/**
 * Render Deployment Script
 * 
 * This script handles the deployment of pre-built assets to Render.com
 * It uses the Render API to deploy without requiring a build on Render's servers
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting deployment to Render.com...');

// Configuration
const config = {
  client: {
    name: 'team-tasks-client',
    buildDir: path.resolve(__dirname, '../client/build'),
    renderServiceId: process.env.RENDER_CLIENT_SERVICE_ID // Set this in your environment or .env file
  },
  server: {
    name: 'team-tasks-server',
    dir: path.resolve(__dirname, '../server'),
    renderServiceId: process.env.RENDER_SERVER_SERVICE_ID // Set this in your environment or .env file
  }
};

// Validate build directory exists
if (!fs.existsSync(config.client.buildDir)) {
  console.error('Error: Build directory does not exist. Run npm run build first.');
  process.exit(1);
}

// Instructions for manual deployment
console.log('\n=== DEPLOYMENT INSTRUCTIONS ===\n');

console.log('1. CLIENT DEPLOYMENT:');
console.log('   Your client build is ready in the "build" directory.');
console.log('   To deploy to Render:');
console.log('   a. Go to your Render dashboard: https://dashboard.render.com');
console.log('   b. Select your client service (team-tasks-client)');
console.log('   c. Under "Settings", set the build command to: ');
console.log('      echo "Using pre-built assets"');
console.log('   d. Set the start command to:');
console.log('      npx serve -s build -l $PORT');
console.log('   e. Deploy the latest commit');

console.log('\n2. SERVER DEPLOYMENT:');
console.log('   To deploy your server to Render:');
console.log('   a. Go to your Render dashboard: https://dashboard.render.com');
console.log('   b. Select your server service (team-tasks-server)');
console.log('   c. Under "Settings", ensure the build command is:');
console.log('      cd server && npm install');
console.log('   d. Ensure the start command is:');
console.log('      cd server && npm start');
console.log('   e. Deploy the latest commit');

console.log('\n3. ENVIRONMENT VARIABLES:');
console.log('   Ensure these environment variables are set in your Render dashboard:');
console.log('   - NODE_ENV=production');
console.log('   - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (for OAuth)');
console.log('   - GOOGLE_REDIRECT_URI (set to https://team-tasks-server.onrender.com/api/auth/google/callback)');
console.log('   - JWT_SECRET (for authentication)');
console.log('   - FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY');
console.log('   - Any other API keys from your .env file');
console.log('   NOTE: Do NOT set PORT - Render will assign this automatically');

console.log('\nAlternatively, if you have the Render CLI installed and configured with API keys:');
console.log('You can automate this process with the Render CLI commands.');

console.log('\n=== BUILD INFORMATION ===');
console.log(`Client build size: ${getFolderSize(config.client.buildDir)} bytes`);
console.log(`Server directory: ${config.server.dir}`);

console.log('\nDeployment preparation complete!');

// Helper function to get folder size
function getFolderSize(folderPath) {
  let totalSize = 0;
  
  function getAllFiles(dirPath) {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile()) {
        totalSize += stats.size;
      } else if (stats.isDirectory()) {
        getAllFiles(filePath);
      }
    }
  }
  
  getAllFiles(folderPath);
  return totalSize;
}
