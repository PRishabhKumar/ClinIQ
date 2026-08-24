import { google } from 'googleapis';

const createOAuthClient = (refreshToken = null) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  
  // Use user-specific token if provided, otherwise fallback to env
  if (refreshToken) {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
  } else if (process.env.GOOGLE_REFRESH_TOKEN) {
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  }
  
  return oauth2Client;
};

// Auth URL for linking calendar (offline access to get refresh token)
export const getCalendarAuthUrl = (state) => {
  const oauth2Client = createOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
    prompt: 'consent', // Force to get refresh token
    state // Can be used to pass userId or action type
  });
};

export const getTokensFromCode = async (code) => {
  const oauth2Client = createOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

export const createEvent = async (appointment, refreshToken, perspective = 'patient') => {
  try {
    const oauth2Client = createOAuthClient(refreshToken);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Doctor sees patient's name; patient sees doctor's name
    const summary = perspective === 'doctor'
      ? `Appointment with ${appointment.patientName || 'Patient'}`
      : `Appointment with Dr. ${appointment.doctor.user.name}`;

    const event = {
      summary,
      description: `ClinIQ Appointment ID: ${appointment.id}`,
      start: {
        dateTime: appointment.startTime,
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: appointment.endTime,
        timeZone: 'Asia/Kolkata',
      },
      reminders: {
        useDefault: true,
      },
    };

    const res = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendUpdates: 'none'
    });
    
    return res.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
};

export const updateEvent = async (eventId, appointment, refreshToken) => {
  try {
    const oauth2Client = createOAuthClient(refreshToken);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary: `Updated: Appointment with Dr. ${appointment.doctor.user.name}`,
      start: {
        dateTime: appointment.startTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: appointment.endTime,
        timeZone: 'UTC',
      },
    };

    const res = await calendar.events.patch({
      calendarId: 'primary',
      eventId: eventId,
      resource: event,
      sendUpdates: 'none'
    });
    return res.data;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
};

export const deleteEvent = async (eventId, refreshToken) => {
  try {
    const oauth2Client = createOAuthClient(refreshToken);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
      sendUpdates: 'none'
    });
    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
};
