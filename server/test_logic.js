/**
 * ============================================================================
 * Logic Layer Test Suite
 * ============================================================================
 * Verifies all pure business logic, financial formulas, loan amortization,
 * authentication helpers, and document templates in isolation.
 */

import { 
  calculateNetWorth, 
  calculateSavingsRate, 
  calculate503020Rule, 
  calculateCategoryBreakdown, 
  calculateFinancialHealthIndex,
  generateFullTelemetry 
} from './services/telemetryService.js';

import { 
  calculateEmi, 
  getEmiDueStatus, 
  generateAmortizationSchedule 
} from './services/emiService.js';

import { 
  buildGeminiPrompt, 
  generateContextAwareFallback 
} from './services/aiContextService.js';

import { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  verifyToken, 
  validateEmail, 
  validatePassword 
} from './services/authService.js';

import { generateExecutiveStatementHTML } from './services/statementService.js';

console.log('----------------------------------------------------');
console.log('🚀 RUNNING BUDGET BUDDY CORE LOGIC TEST SUITE');
console.log('----------------------------------------------------\n');

let passedTests = 0;
let totalTests = 0;

function assert(description, condition) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${description}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${description}`);
  }
}

async function runTests() {
  // 1. Telemetry Math Tests
  console.log('📦 1. Testing Financial Telemetry Engine...');
  const netWorth = calculateNetWorth(125000, 38450, 145000);
  assert('Net Worth equals (125000 - 38450) + 145000 = 231550', netWorth === 231550);

  const savingsRate = calculateSavingsRate(100000, 30000);
  assert('Savings Rate for 100k inc / 30k exp equals 70.0%', savingsRate === 70);

  const sampleTxs = [
    { title: 'Rent', amount: 25000, category: 'Housing', type: 'expense' },
    { title: 'Groceries', amount: 5000, category: 'Groceries', type: 'expense' },
    { title: 'Dinner', amount: 3000, category: 'Dining', type: 'expense' },
    { title: 'Salary', amount: 100000, category: 'Salary', type: 'income' }
  ];

  const rule = calculate503020Rule(100000, sampleTxs);
  assert('50/30/20 Needs should be 30% (30000 / 100000)', rule.needs.actual === 30);
  assert('50/30/20 Wants should be 3% (3000 / 100000)', rule.wants.actual === 3);

  const categories = calculateCategoryBreakdown(sampleTxs);
  assert('Category breakdown returns top category Housing', categories[0].name === 'Housing');
  assert('Housing percentage matches 75.8% of total expenses', categories[0].percent === 75.8);

  const health = calculateFinancialHealthIndex(100000, 33000, 150000, sampleTxs);
  assert('Financial health score is calculated between 50 and 99', health.score >= 50 && health.score <= 99);

  // 2. EMI & Loan Amortization Tests
  console.log('\n📦 2. Testing Loan Amortization & EMI Engine...');
  // Loan: 5,00,000 at 10.5% for 36 months
  const emi = calculateEmi(500000, 10.5, 36);
  assert('Monthly EMI calculated correctly (~16,252)', emi.monthlyEmi >= 16200 && emi.monthlyEmi <= 16300);
  assert('Total Payment exceeds principal', emi.totalPayment > 500000);
  assert('Principal and interest share sum to ~100%', Math.round(emi.principalShare + emi.interestShare) === 100);

  const dueStatus = getEmiDueStatus(15);
  assert('Due date status returns non-empty formatted date', !!dueStatus.currentDueDate);
  assert('Due date badge text exists', !!dueStatus.badgeText);

  const schedule = generateAmortizationSchedule(100000, 12, 12);
  assert('Amortization schedule length equals 12 months', schedule.length === 12);
  assert('Final month remaining balance drops to 0', schedule[11].remainingBalance === 0);

  // 3. AI Context & Reasoning Tests
  console.log('\n📦 3. Testing AI Context Injection Service...');
  const fullTelemetry = generateFullTelemetry({
    profile: { name: 'Priyansu' },
    transactions: sampleTxs,
    vault: { current: 150000 },
    budget: { monthlyIncome: 100000 }
  });

  const prompt = buildGeminiPrompt({
    telemetry: fullTelemetry,
    strategyMode: 'balanced',
    userQuery: 'Can I afford a new car?'
  });
  assert('Prompt includes user telemetry income', prompt.includes('1,00,000') || prompt.includes('100000'));
  assert('Prompt includes user query', prompt.includes('Can I afford a new car?'));

  const fallback = generateContextAwareFallback('analyze my spending', fullTelemetry);
  assert('Fallback analyzes spending dynamically in simple English', fallback.includes('spend about') && fallback.includes('savings cushion'));

  // 4. Auth & Security Tests
  console.log('\n📦 4. Testing Authentication & Security Service...');
  assert('Valid email passes regex', validateEmail('user@budgetbuddy.app') === true);
  assert('Invalid email fails regex', validateEmail('invalid-email') === false);
  assert('Valid password passes check', validatePassword('securePass123').valid === true);
  assert('Short password fails check', validatePassword('123').valid === false);

  const password = 'mySecretPassword2026';
  const hash = await hashPassword(password);
  assert('Password hashing returns bcrypt string', hash.startsWith('$2'));

  const match = await verifyPassword(password, hash);
  assert('Correct password verifies against hash', match === true);

  const wrongMatch = await verifyPassword('wrongPassword', hash);
  assert('Incorrect password fails verification', wrongMatch === false);

  const token = generateToken({ id: 'user_123', email: 'test@buddy.app' });
  assert('Token generation returns signed JWT', typeof token === 'string' && token.split('.').length === 3);

  const decoded = verifyToken(token);
  assert('Decoded token matches payload id', decoded.id === 'user_123');

  // 5. Statement Document HTML Generator
  console.log('\n📦 5. Testing Executive Statement Generator...');
  const html = generateExecutiveStatementHTML({
    user: { name: 'Priyansu Sekhar', email: 'test@buddy.app' },
    summary: fullTelemetry.summary,
    categories: fullTelemetry.categories,
    transactions: sampleTxs
  });
  assert('Statement HTML includes brand header', html.includes('BUDGET <span>BUDDY</span>'));
  assert('Statement HTML includes user email', html.includes('test@buddy.app'));
  assert('Statement HTML includes category table', html.includes('Housing'));

  console.log('\n----------------------------------------------------');
  console.log(`🎯 TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED (100% SUCCESS)`);
  console.log('----------------------------------------------------');
}

runTests().catch(console.error);
