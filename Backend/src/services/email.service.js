import nodemailer from 'nodemailer';

let transporter;

// Initialize Transporter
if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  // Use real SMTP server (e.g. Gmail, SendGrid, etc)
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 10000,   // 10s to establish connection
    greetingTimeout: 10000,     // 10s to receive SMTP greeting
    socketTimeout: 15000,       // 15s idle socket timeout
    tls: {
      servername: 'smtp.gmail.com'  // ensure cert validation even if DNS is slow
    }
  });
  console.log('Nodemailer initialized with external SMTP.');
} else {
  // Initialize Ethereal Email for testing dynamically
  nodemailer.createTestAccount().then((account) => {
    transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: {
        user: account.user,
        pass: account.pass
      }
    });
    console.log('Nodemailer Ethereal account initialized.');
  }).catch(err => {
    console.error('Failed to create Ethereal test account:', err);
  });
}

// Generic send function
const sendEmail = async (to, subject, html) => {
  if (!transporter) {
    console.error('Transporter not initialized yet.');
    throw new Error('Transporter not initialized');
  }
  try {
    const info = await transporter.sendMail({
      from: '"ClinIQ" <no-reply@cliniq.test>',
      to,
      subject,
      html
    });
    console.log(`Email sent: ${info.messageId}`);
    // Ethereal provides a URL to preview the sent email
    console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export const sendBookingConfirmation = async (appointment) => {
  // 1. Send to Patient
  const patientSubject = 'Appointment Confirmation - ClinIQ';
  const patientHtml = `
    <h1>Booking Confirmed</h1>
    <p>Dear ${appointment.patient?.name || 'Patient'},</p>
    <p>Your appointment has been successfully booked.</p>
    <p><strong>Doctor:</strong> Dr. ${appointment.doctor?.user?.name || 'Doctor'}</p>
    <p><strong>Date:</strong> ${new Date(appointment.slotStart).toLocaleString()}</p>
    <p>Thank you for choosing ClinIQ.</p>
  `;
  const patientEmail = appointment.patientEmail || appointment.patient?.email || 'patient@example.com';
  await sendEmail(patientEmail, patientSubject, patientHtml);

  // 2. Send to Doctor
  if (appointment.doctor?.user?.email) {
    const doctorSubject = 'New Appointment Scheduled - ClinIQ';
    const doctorHtml = `
      <h1>New Appointment</h1>
      <p>Dear Dr. ${appointment.doctor.user.name},</p>
      <p>An appointment is scheduled at <strong>${new Date(appointment.slotStart).toLocaleString()}</strong> with <strong>${appointment.patient?.name || 'a patient'}</strong>.</p>
      <p>Please log in to your dashboard to view full details and clinical notes.</p>
    `;
    await sendEmail(appointment.doctor.user.email, doctorSubject, doctorHtml);
  }
};

export const sendCancellation = async (appointment) => {
  // This is triggered when the Patient cancels the appointment.
  
  // 1. Send to Patient
  const patientEmail = appointment.patientEmail || appointment.patient?.email;
  if (patientEmail) {
    const patientSubject = 'Appointment Cancellation - ClinIQ';
    const patientHtml = `
      <h1>Booking Cancelled</h1>
      <p>Dear ${appointment.patient?.name || 'Patient'},</p>
      <p>You have cancelled the meeting with Dr. ${appointment.doctor?.user?.name || 'Doctor'} on ${new Date(appointment.slotStart).toLocaleString()}.</p>
    `;
    await sendEmail(patientEmail, patientSubject, patientHtml);
  }

  // 2. Send to Doctor
  const doctorEmail = appointment.doctor?.user?.email;
  if (doctorEmail) {
    const doctorSubject = 'Appointment Cancelled by Patient - ClinIQ';
    const doctorHtml = `
      <h1>Booking Cancelled</h1>
      <p>Dear Dr. ${appointment.doctor?.user?.name || 'Doctor'},</p>
      <p>The appointment with ${appointment.patient?.name || 'the patient'} on ${new Date(appointment.slotStart).toLocaleString()} was cancelled by the patient.</p>
    `;
    await sendEmail(doctorEmail, doctorSubject, doctorHtml);
  }
};

export const sendLeaveConflict = async (appointment) => {
  // This is triggered when the Doctor takes leave (Doctor cancels the appointment).
  
  // 1. Send to Patient
  const patientEmail = appointment.patientEmail || appointment.patient?.email;
  if (patientEmail) {
    const patientSubject = 'Appointment Cancelled by Doctor - ClinIQ';
    const patientHtml = `
      <h1>Appointment Cancelled</h1>
      <p>Dear ${appointment.patient?.name || 'Patient'},</p>
      <p>The appointment on ${new Date(appointment.slotStart).toLocaleString()} was cancelled by the doctor (Dr. ${appointment.doctor?.user?.name || 'Doctor'}).</p>
      <p>Please log in to reschedule your appointment.</p>
    `;
    await sendEmail(patientEmail, patientSubject, patientHtml);
  }

  // 2. Send to Doctor
  const doctorEmail = appointment.doctor?.user?.email;
  if (doctorEmail) {
    const doctorSubject = 'Appointment Cancelled (Leave) - ClinIQ';
    const doctorHtml = `
      <h1>Appointment Cancelled</h1>
      <p>Dear Dr. ${appointment.doctor?.user?.name || 'Doctor'},</p>
      <p>You have cancelled the meeting with ${appointment.patient?.name || 'the patient'} on ${new Date(appointment.slotStart).toLocaleString()} due to leave.</p>
    `;
    await sendEmail(doctorEmail, doctorSubject, doctorHtml);
  }
};
