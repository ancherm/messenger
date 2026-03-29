import type { ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import UserProfilePage from "./pages/UserProfilePage";
import ChatListPage from "./pages/ChatListPage";
import { getAuthToken } from "./auth/storage";

function ProtectedRoute({ children }: { children: ReactElement }) {
  const location = useLocation();

  if (!getAuthToken()) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function PublicOnlyRoute({ children }: { children: ReactElement }) {
  if (getAuthToken()) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/auth"
          element={
            <PublicOnlyRoute>
              <AuthPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ChatListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:id/profile"
          element={
            <ProtectedRoute>
              <UserProfilePage readOnly />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
