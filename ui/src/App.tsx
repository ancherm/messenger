import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import UserProfilePage from "./pages/UserProfilePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/profile" element={<UserProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
}