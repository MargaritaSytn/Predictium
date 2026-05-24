import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import EventListPage from "./pages/EventListPage";
import EventDetailPage from "./pages/EventDetailPage";
import ProfilePage from "./pages/ProfilePage";
import BuyTokensPage from "./pages/BuyTokensPage";
import PremiumPage from "./pages/PremiumPage";
import FinancePage from "./pages/FinancePage";
import WithdrawPage from "./pages/WithdrawPage";
import ModerationPage from "./pages/ModerationPage";
import UserProfilePage from "./pages/UserProfilePage";

export default function App() {
  return (
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
            <Route path="/buy-tokens" element={<BuyTokensPage />} />
            <Route path="/premium" element={<PremiumPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/withdraw" element={<WithdrawPage />} />
            <Route path="/moderation" element={<ModerationPage />} />
            <Route path="/users/:id" element={<UserProfilePage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
