import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import EventListPage from "./pages/EventListPage";
import EventDetailPage from "./pages/EventDetailPage";
import ProfilePage from "./pages/ProfilePage";
import FinancePage from "./pages/FinancePage";
import BuyTokensPage from "./pages/BuyTokensPage";
import WithdrawPage from "./pages/WithdrawPage";
import PremiumPage from "./pages/PremiumPage";
import ModerationPage from "./pages/ModerationPage";
import UserProfilePage from "./pages/UserProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import AdminPage from "./pages/AdminPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import PaymentResultPage from "./pages/PaymentResultPage";

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/events" element={<EventListPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/buy-tokens" element={<BuyTokensPage />} />
              <Route path="/withdraw" element={<WithdrawPage />} />
              <Route path="/premium" element={<PremiumPage />} />
              <Route path="/moderation" element={<ModerationPage />} />
              <Route path="/users/:id" element={<UserProfilePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/analytics" element={<AnalyticsPage />} />
              <Route path="/payment/success" element={<PaymentResultPage status="success" />} />
              <Route path="/payment/cancel" element={<PaymentResultPage status="cancel" />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
