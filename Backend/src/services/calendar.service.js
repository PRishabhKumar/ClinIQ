import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// We assume there's a stored token for the clinic that is loaded elsewhere
// e.g., oauth2Client.setCredentials({ refresh_token: '...' });

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

export const setCredentials = (tokens) => {
  oauth2Client.setCredentials(tokens);
};

export const getAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    prompt: 'consent' // Force to get refresh token
  });
};

export const getToken = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

export const createEvent = async (appointment) => {
  try {
    const event = {
      summary: `Appointment with Dr. ${appointment.doctor.user.name}`,
      description: `Appointment ID: ${appointment.id}\nPatient: ${appointment.patientEmail || 'Unknown'}`,
      start: {
        dateTime: appointment.startTime,
        timeZone: 'UTC', // Ensure timeZone is correct based on requirements
      },
      end: {
        dateTime: appointment.endTime,
        timeZone: 'UTC',
      },
      attendees: [
        { email: appointment.patientEmail || 'patient@example.com' },
        { email: appointment.doctor.user.email || 'doctor@example.com' }
      ],
      reminders: {
        useDefault: true,
      },
    };

    const res = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendUpdates: 'all' // Sends email to attendees
    });
    
    return res.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
};

export const updateEvent = async (eventId, appointment) => {
  try {
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
      sendUpdates: 'all'
    });
    return res.data;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
};

export const deleteEvent = async (eventId) => {
  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
      sendUpdates: 'all'
    });
    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
};
