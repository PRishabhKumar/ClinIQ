async function testFlow() {
  try {
    // 1. Login
    const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sarah.jenkins@cliniq.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.data.accessToken;
    console.log('Logged in.');

    // 2. Get doctors
    const doctorsRes = await fetch('http://localhost:5000/api/v1/doctors', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const doctorsData = await doctorsRes.json();
    console.log('doctorsData:', doctorsData);
    const doctorId = doctorsData.data[0].id;
    
    // 3. Get availability for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    const slotsRes = await fetch(`http://localhost:5000/api/v1/doctors/${doctorId}/availability?date=${dateStr}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const slotsData = await slotsRes.json();
    const slot = slotsData.data[0];
    
    if (!slot) {
      console.log('No slots available to test.');
      return;
    }

    // 4. Hold slot
    const holdRes = await fetch('http://localhost:5000/api/v1/appointments/hold', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({
        doctorId,
        slotStart: slot.slotStart,
        slotEnd: slot.slotEnd
      })
    });
    const holdData = await holdRes.json();
    console.log('holdData:', holdData);
    const appointmentId = holdData.data.id;
    console.log('Held appointment:', appointmentId);

    // 5. Submit symptoms
    const symptomsRes = await fetch(`http://localhost:5000/api/v1/appointments/${appointmentId}/symptoms`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({
        rawText: 'Severe headache',
        durationDays: 2,
        severity: 'Medium'
      })
    });
    const symptomsData = await symptomsRes.json();
    
    console.log('Success:', symptomsData);

  } catch (error) {
    console.error('Error occurred:', error.message);
  }
}

testFlow();
