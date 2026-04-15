const testSubmit = async () => {
  // 1. Auth/Login
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamName: 'TestTeam5', password: 'password123' })
  });
  const { token, team } = await loginRes.json();
  console.log('Logged in:', team);

  // 2. Submit Case 1
  const submitRes = await fetch('http://localhost:3000/api/cases/1/submit', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      attackerName: 'Test Attacker',
      attackMethod: 'Test Method',
      preventionMeasures: 'Test Prevention'
    })
  });
  
  const submitText = await submitRes.text();
  console.log('Submit response:', submitRes.status, submitText);
}

testSubmit().catch(console.error);
