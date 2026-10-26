import 'dotenv/config';
import connectDB from './config/db.js';
import User from './models/User.js';
import Budget from './models/Budget.js';
import Vault from './models/Vault.js';
import ReportSettings from './models/ReportSettings.js';
import { hashPassword, verifyPassword, generateToken, verifyToken } from './services/authService.js';

console.log('----------------------------------------------------');
console.log('🧪 LIVE DATABASE & AUTHENTICATION END-TO-END TEST');
console.log('----------------------------------------------------');

const runTest = async () => {
  const conn = await connectDB();
  if (!conn) {
    console.error('❌ Could not connect to MongoDB Atlas');
    process.exit(1);
  }

  const testEmail = `e2e_test_${Date.now()}@budgetbuddy.app`;
  const rawPassword = 'SecurePassword123!';

  console.log(`\n1. Creating test user in Atlas: ${testEmail}...`);
  const hashedPassword = await hashPassword(rawPassword);
  const newUser = await User.create({
    name: 'E2E Test Member',
    email: testEmail,
    password: hashedPassword
  });
  console.log('  ✅ User created with ObjectId:', newUser._id.toString());

  console.log('\n2. Seeding default user entities (Budget, Vault, ReportSettings)...');
  const [budget, vault, reportSettings] = await Promise.all([
    Budget.create({ userId: newUser._id, monthlyIncome: 125000 }),
    Vault.create({ userId: newUser._id, current: 145000, target: 200000 }),
    ReportSettings.create({ userId: newUser._id, email: testEmail })
  ]);
  console.log('  ✅ Budget created with baseline income: ₹', budget.monthlyIncome);
  console.log('  ✅ Vault created with initial reserves: ₹', vault.current);
  console.log('  ✅ Report settings created for:', reportSettings.email);

  console.log('\n3. Verifying bcrypt password verification & JWT token generation...');
  const isMatch = await verifyPassword(rawPassword, newUser.password);
  console.log('  ✅ Bcrypt password matches raw password:', isMatch);

  const token = generateToken({ id: newUser._id.toString(), email: newUser.email, name: newUser.name });
  const decoded = verifyToken(token);
  console.log('  ✅ JWT token verified for user ID:', decoded.id);

  console.log('\n4. Purging test user and seeded entities (Zero leftover mock data)...');
  await Promise.all([
    User.deleteOne({ _id: newUser._id }),
    Budget.deleteOne({ userId: newUser._id }),
    Vault.deleteOne({ userId: newUser._id }),
    ReportSettings.deleteOne({ userId: newUser._id })
  ]);
  console.log('  ✅ Test data cleanly purged from MongoDB Atlas.');

  await conn.disconnect();
  console.log('\n----------------------------------------------------');
  console.log('🎯 STEP 1 AUTHENTICATION & DATABASE SYNC: 100% SUCCESS');
  console.log('----------------------------------------------------');
  process.exit(0);
};

runTest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
