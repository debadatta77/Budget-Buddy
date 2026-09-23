import { Routes, Route } from 'react-router-dom';
import HeroSection from '../pages/Home/heroSection';
import ExpensesPage from '../pages/expenses/ExpensesPage';
import BudgetPage from '../pages/budget/BudgetPage';
import ProfilePage from '../pages/profile/ProfilePage';
import AboutPage from '../pages/about/AboutPage';
import AnalyticsPage from '../pages/analytics/AnalyticsPage';
import AiAdvisorPage from '../pages/aiAdvisor/AiAdvisorPage';
import FinancialHealthPage from '../pages/financialHealth/FinancialHealthPage';
import ReportsPage from '../pages/reports/ReportsPage';
import ContactPage from '../pages/contact/ContactPage';
import AuthPage from '../pages/auth/AuthPage';
import AdminPage from '../pages/admin/AdminPage';
import NotFoundPage from '../pages/notFound';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HeroSection />} />
      <Route path="/dashboard" element={<HeroSection />} />
      <Route path="/expenses" element={<ExpensesPage />} />
      <Route path="/budget" element={<BudgetPage />} />
      <Route path="/savings" element={<BudgetPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/ai-advisor" element={<AiAdvisorPage />} />
      <Route path="/financial-health" element={<FinancialHealthPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
