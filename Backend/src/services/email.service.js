import nodemailer from 'nodemailer';

// Configure Ethereal Email for testing
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: process.env.EMAIL_USER || 'test@ethereal.email', // Add these to .env if you create a real ethereal account
    pass: process.env.EMAIL_PASS || 'testpassword'
  }
});

// Generic send function
const sendEmail = async (to, subject, html) => {
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
  const subject = 'Appointment Confirmation - ClinIQ';
  const html = `
    <h1>Booking Confirmed</h1>
    <p>Dear Patient,</p>
    <p>Your appointment has been successfully booked.</p>
    <p><strong>Doctor:</strong> Dr. ${appointment.doctor.user.name}</p>
    <p><strong>Date:</strong> ${new Date(appointment.startTime).toLocaleString()}</p>
    <p>Thank you for choosing ClinIQ.</p>
  `;
  // Assuming patient email is available. If not, we might need to fetch it or pass it in.
  // For now, let's assume it's passed in appointment.patientEmail or similar.
  const to = appointment.patientEmail || 'patient@example.com';
  return sendEmail(to, subject, html);
};

export const sendCancellation = async (appointment) => {
  const subject = 'Appointment Cancellation - ClinIQ';
  const html = `
    <h1>Booking Cancelled</h1>
    <p>Dear Patient,</p>
    <p>Your appointment with Dr. ${appointment.doctor.user.name} on ${new Date(appointment.startTime).toLocaleString()} has been cancelled.</p>
    <p>We apologize for the inconvenience.</p>
  `;
  const to = appointment.patientEmail || 'patient@example.com';
  return sendEmail(to, subject, html);
};

export const sendLeaveConflict = async (appointment) => {
  const subject = 'Appointment Rescheduled Required - ClinIQ';
  const html = `
    <h1>Appointment Rescheduling Needed</h1>
    <p>Dear Patient,</p>
    <p>Your appointment with Dr. ${appointment.doctor.user.name} on ${new Date(appointment.startTime).toLocaleString()} conflicts with the doctor's leave.</p>
    <p>Please contact us to reschedule your appointment.</p>
  `;
  const to = appointment.patientEmail || 'patient@example.com';
  return sendEmail(to, subject, html);
};
