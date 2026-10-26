import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HeroSection from '../pages/Home/heroSection';
import DashboardPage from '../pages/dashboard/DashboardPage';
import ExpensesPage from '../pages/expenses/ExpensesPage';
import BudgetPage from '../pages/budget/BudgetPage';
import EmiStudioPage from '../pages/emiStudio/EmiStudioPage';
import ProfilePage from '../pages/profile/ProfilePage';
import AboutPage from '../pages/about/AboutPage';
import AnalyticsPage from '../pages/analytics/AnalyticsPage';
import AiAdvisorPage from '../pages/aiAdvisor/AiAdvisorPage';
import FinancialHealthPage from '../pages/financialHealth/FinancialHealthPage';
import ReportsPage from '../pages/reports/ReportsPage';
import AuthPage from '../pages/auth/AuthPage';
import AdminPage from '../pages/admin/AdminPage';
import NotFoundPage from '../pages/notFound';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ openAuth: true, from: location }} replace />;
  }

  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HeroSection />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<Navigate to="/" replace />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/admin" element={<AdminPage />} />

      {/* Protected Financial Application Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses"
        element={
          <ProtectedRoute>
            <ExpensesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/budget"
        element={
          <ProtectedRoute>
            <BudgetPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/savings"
        element={
          <ProtectedRoute>
            <BudgetPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/emi-studio"
        element={
          <ProtectedRoute>
            <EmiStudioPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cards"
        element={
          <ProtectedRoute>
            <EmiStudioPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-advisor"
        element={
          <ProtectedRoute>
            <AiAdvisorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/financial-health"
        element={
          <ProtectedRoute>
            <FinancialHealthPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;

