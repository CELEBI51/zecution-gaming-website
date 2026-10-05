async function runTest() {
  const baseUrl = 'http://localhost:4000/api/auth'

  console.log('--- 1. Testing Troll Username Rejection ---')
  const trollTests = [
    { username: 'troll_player', email: 'test1@gmail.com' },
    { username: '12345678', email: 'test2@gmail.com' },
    { username: 'orospu_pro', email: 'test3@gmail.com' },
    { username: 'aaaaaaa', email: 'test4@gmail.com' },
  ]

  for (const t of trollTests) {
    const res = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: t.username,
        email: t.email,
        password: 'Password123!',
      }),
    })
    const data = await res.json()
    console.log(`Username "${t.username}": status=${res.status}, error="${data.error?.message}"`)
    if (res.status !== 400) {
      throw new Error(`Expected 400 for troll username ${t.username}, got ${res.status}`)
    }
  }

  console.log('\n--- 2. Testing Disposable Email Rejection ---')
  const fakeEmailRes = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'SanalSavasci',
      email: 'sanalsavasci@tempmail.com',
      password: 'Password123!',
    }),
  })
  const fakeEmailData = await fakeEmailRes.json()
  console.log(`Disposable email: status=${fakeEmailRes.status}, error="${fakeEmailData.error?.message}"`)
  if (fakeEmailRes.status !== 400) {
    throw new Error('Expected 400 for disposable email')
  }

  console.log('\n--- 3. Testing Real Registration & Verification Flow ---')
  const testUser = {
    username: `ZecGamer_${Date.now().toString().slice(-4)}`,
    email: `zecgamer_${Date.now().toString().slice(-4)}@gmail.com`,
    password: 'SecurePassword123!',
  }

  const regRes = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser),
  })
  const regData = await regRes.json()
  console.log('Registration response:', regData)
  if (!regData.success || !regData.data.needsVerification) {
    throw new Error('Expected needsVerification: true on register')
  }

  const { prisma } = await import('../src/config/database.js')
  const dbUser = await prisma.user.findUnique({ where: { email: testUser.email } })
  const secretCode = dbUser?.verificationCode
  console.log(`Database verification code (sent to user email): ${secretCode}`)
  if (!secretCode) throw new Error('Code was not stored in database!')

  console.log('\n--- 4. Testing Invalid Code ---')
  const badVerifyRes = await fetch(`${baseUrl}/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testUser.email,
      code: '999999',
    }),
  })
  const badVerifyData = await badVerifyRes.json()
  console.log(`Bad code verify: status=${badVerifyRes.status}, error="${badVerifyData.error?.message}"`)
  if (badVerifyRes.status !== 400) {
    throw new Error('Expected 400 for invalid verification code')
  }

  console.log('\n--- 5. Testing Valid Code Verification ---')
  const validVerifyRes = await fetch(`${baseUrl}/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testUser.email,
      code: secretCode,
    }),
  })
  const validVerifyData = await validVerifyRes.json()
  console.log('Valid code verify response:', validVerifyData)
  if (!validVerifyData.success || !validVerifyData.data.user.isEmailVerified) {
    throw new Error('Expected successful verification and user.isEmailVerified=true')
  }

  console.log('\n--- 6. Testing Successful Login With Verified Account ---')
  const loginRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emailOrUsername: testUser.email,
      password: testUser.password,
    }),
  })
  const loginData = await loginRes.json()
  console.log('Login response:', loginData)
  if (!loginData.success || !loginData.data.user.isEmailVerified) {
    throw new Error('Expected successful login with verified user')
  }

  console.log('\n✅ ALL ANTI-TROLL & EMAIL VERIFICATION TESTS PASSED SUCCESSFULLY!')
}

runTest().catch((err) => {
  console.error('Test failed:', err)
  process.exit(1)
})
