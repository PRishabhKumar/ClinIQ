import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import { processNotifications } from './src/jobs/notification.job.js';
import { scheduleReminders } from './src/jobs/reminder.job.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start background jobs
  setInterval(() => {
    scheduleReminders();
    processNotifications();
  }, 60 * 1000); // Run every 1 minute
});
