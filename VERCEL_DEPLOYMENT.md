# Vercel Deployment Guide for Finance Dashboard

## Setting up Vercel Cron Jobs

### 1. Environment Variables in Vercel
Add these environment variables in your Vercel dashboard:

```bash
MONGODB_URI=mongodb+srv://jledits20:GQCyitz29e5Mjkcj@marketing.o5zxt1g.mongodb.net/financeV1?retryWrites=true&w=majority&appName=marketing
CRON_SECRET=your-secure-random-secret-key-here
```

### 2. Generate a Secure Cron Secret
Run this command to generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Vercel Configuration
The `vercel.json` file has been configured to run cron jobs every 30 minutes:
- Path: `/api/cron/sync`
- Schedule: `0 */30 * * * *` (every 30 minutes)

### 4. Testing the Cron Job
After deployment, you can test the cron endpoint:
```bash
curl -X GET https://your-app.vercel.app/api/cron/sync \
  -H "Authorization: Bearer your-cron-secret"
```

### 5. Vercel Cron Dashboard
- Go to your Vercel project dashboard
- Navigate to the "Functions" tab
- You should see your cron function listed
- Check the execution logs for any issues

## Date Format Issues Fixed

The date formatting has been improved to handle multiple formats:
- Unix timestamps (10 and 13 digits)
- ISO date strings
- Custom date formats from the API
- Fallback to current date for invalid formats

## Manual Sync
The manual sync button will continue to work and trigger immediate data synchronization.

## Monitoring
- Check Vercel function logs for cron execution
- Monitor the sync status indicator in the dashboard
- Manual sync provides immediate feedback
