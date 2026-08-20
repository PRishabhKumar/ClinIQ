CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "Appointment" ADD CONSTRAINT no_overlapping_appointments
  EXCLUDE USING gist (
    "doctorId" WITH =,
    tsrange("slotStart", "slotEnd") WITH &&
  ) WHERE (status IN ('HELD', 'BOOKED'));
