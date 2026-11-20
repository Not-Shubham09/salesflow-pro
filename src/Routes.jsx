import React, { useEffect } from "react";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";

// Page imports
import Login from "pages/login";
import SalesDashboard from "pages/sales-dashboard";
import DealManagement from "pages/deal-management";
import ContactManagement from "pages/contact-management";
import PipelineAnalytics from "pages/pipeline-analytics";
import ActivityTimeline from "pages/activity-timeline";
import SettingsAdministration from "pages/settings-administration";
import NotFound from "pages/NotFound";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute><SalesDashboard /></ProtectedRoute>} />
          <Route path="/sales-dashboard" element={<ProtectedRoute><SalesDashboard /></ProtectedRoute>} />
          
          <Route path="/deal-management" element={<ProtectedRoute><DealManagement /></ProtectedRoute>} />
          <Route path="/deal-management/:id" element={<ProtectedRoute><DealManagement /></ProtectedRoute>} />
          <Route path="/deals" element={<Navigate to="/deal-management" replace />} />
          
          <Route path="/contact-management" element={<ProtectedRoute><ContactManagement /></ProtectedRoute>} />
          <Route path="/contacts" element={<Navigate to="/contact-management" replace />} />
          
          <Route path="/pipeline-analytics" element={<ProtectedRoute><PipelineAnalytics /></ProtectedRoute>} />
          <Route path="/analytics" element={<Navigate to="/pipeline-analytics" replace />} />
          
          <Route path="/activity-timeline" element={<ProtectedRoute><ActivityTimeline /></ProtectedRoute>} />
          <Route path="/activities" element={<Navigate to="/activity-timeline" replace />} />
          
          <Route path="/settings-administration" element={<ProtectedRoute><SettingsAdministration /></ProtectedRoute>} />
          <Route path="/settings" element={<Navigate to="/settings-administration" replace />} />
          
          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
