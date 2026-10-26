import assert from 'assert';
import app from './index.js';
import { generateToken, verifyToken } from './services/authService.js';
import { calculateEmi, generateAmortizationSchedule } from './services/emiService.js';
import { generateFullTelemetry } from './services/telemetryService.js';
import { buildGeminiPrompt, generateContextAwareFallback } from './services/aiContextService.js';
import { generateExecutiveStatementHTML } from './services/statementService.js';

console.log('----------------------------------------------------');
console.log('🧪 RUNNING BUDGET BUDDY MVC ARCHITECTURE VERIFICATION');
console.log('----------------------------------------------------');

let passedCount = 0;
const test = (description, fn) => {
  try {
    fn();
    console.log(`  ✅ PASS: ${description}`);
    passedCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(`     Error: ${err.message}`);
    process.exit(1);
  }
};

// 1. Verify Express App Structure
console.log('\n📦 1. Verifying Express Router Stack...');
const routerStack = app.router?.stack || app._router?.stack;

test('Express app is initialized and contains middleware stack', () => {
  assert(routerStack && Array.isArray(routerStack), 'Express app should have an initialized router stack');
  assert(routerStack.length > 5, 'Router stack should contain mounted route handlers');
});

test('App includes 11 mounted MVC router instances', () => {
  const routerLayers = routerStack.filter(r => r.name === 'router');
  assert.strictEqual(routerLayers.length, 11, 'Express router stack must contain 11 mounted routers for MVC modules');
});

// 2. Verify Authentication Middleware & Tokens
console.log('\n📦 2. Verifying Token & Auth Security Pipeline...');
const mockPayload = { id: '65f1234567890abcdef12345', email: 'test@budgetbuddy.app', name: 'Security Tester' };
const token = generateToken(mockPayload);

test('JWT generation creates valid signed token string', () => {
  assert(typeof token === 'string' && token.split('.').length === 3, 'Token must be standard 3-part JWT');
});

test('verifyToken extracts original payload claims accurately', () => {
  const verified = verifyToken(token);
  assert.strictEqual(verified.id, mockPayload.id);
  assert.strictEqual(verified.email, mockPayload.email);
});

// 3. Verify Financial Telemetry Engine (Centralized Hub)
console.log('\n📦 3. Verifying Portfolio Telemetry Engine...');
const mockTelemetry = generateFullTelemetry({
  profile: { name: 'Priyansu Sekhar', email: 'priyansu@example.com' },
  transactions: [
    { title: 'Salary', amount: 150000, type: 'income', category: 'Income' },
    { title: 'Rent', amount: 35000, type: 'expense', category: 'Housing' },
    { title: 'Dining', amount: 5000, type: 'expense', category: 'Food' }
  ],
  vault: { current: 200000, target: 500000 },
  budget: { monthlyIncome: 150000, categories: [] }
});

test('Calculates accurate Net Worth: (150000 - 40000) + 200000 = 310000', () => {
  assert.strictEqual(mockTelemetry.summary.netWorth, 310000);
});

test('Calculates accurate Net Savings: 150000 - 40000 = 110000', () => {
  assert.strictEqual(mockTelemetry.summary.netSavings, 110000);
});

test('Categorizes Needs and Wants correctly according to 50/30/20 framework', () => {
  assert(mockTelemetry.rule503020.needs.actual > 0, 'Needs must be greater than 0');
  assert(mockTelemetry.rule503020.savings.actual > 0, 'Savings must be greater than 0');
});

// 4. Verify EMI Studio Engine
console.log('\n📦 4. Verifying EMI & Loan Studio Computations...');
const emiResult = calculateEmi(500000, 10.5, 36);
test('Loan calculation yields correct monthly EMI and principal share', () => {
  assert(emiResult.monthlyEmi > 15000 && emiResult.monthlyEmi < 17000, 'EMI should be around ~16,252');
  assert.strictEqual(emiResult.principalShare + emiResult.interestShare, 100);
});

const schedule = generateAmortizationSchedule(100000, 12, 6);
test('Amortization schedule amortizes to 0 across 6 months', () => {
  assert.strictEqual(schedule.length, 6);
  assert.strictEqual(schedule[5].remainingBalance, 0);
});

// 5. Verify AI Advisor Prompt Builder & Fallback
console.log('\n📦 5. Verifying AI Intelligence Service...');
const aiPrompt = buildGeminiPrompt({
  telemetry: mockTelemetry,
  strategyMode: 'aggressive',
  userQuery: 'How can I reach ₹10 Lakhs net worth fastest?'
});

test('AI Prompt builder injects live telemetry and financial snapshot', () => {
  assert(aiPrompt.includes('1,50,000') || aiPrompt.includes('1,10,000'), 'Prompt must contain current income or surplus');
  assert(aiPrompt.includes('USER FINANCIAL SNAPSHOT'), 'Prompt must inject user financial snapshot');
});

const fallbackResponse = generateContextAwareFallback('Can you analyze my burn rate and spending?', mockTelemetry);
test('Offline fallback generates dynamic context-driven advice', () => {
  assert(fallbackResponse.includes('spend about') || fallbackResponse.includes('savings cushion'), 'Fallback should provide dynamic advice');
  assert(fallbackResponse.length > 50, 'Fallback advice must be comprehensive');
});

// 6. Verify Executive Statement Generator
console.log('\n📦 6. Verifying Executive Statement Service...');
const statementHtml = generateExecutiveStatementHTML({
  user: { name: 'Priyansu Sekhar', email: 'priyansu@budgetbuddy.app' },
  summary: mockTelemetry.summary,
  categories: mockTelemetry.categories,
  transactions: mockTelemetry.transactions,
  periodName: 'October 2026'
});

test('Statement HTML renders complete executive document with CSS styling', () => {
  assert(statementHtml.includes('BUDGET'), 'HTML must include brand');
  assert(statementHtml.includes('priyansu@budgetbuddy.app'), 'HTML must include user email');
  assert(statementHtml.includes('Cash Flow Trajectory'), 'HTML must include trajectory section');
});

console.log('\n----------------------------------------------------');
console.log(`🎯 ALL ${passedCount} ARCHITECTURE VERIFICATION TESTS PASSED`);
console.log('----------------------------------------------------');
process.exit(0);
