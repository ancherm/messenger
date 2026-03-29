import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import UserProfilePage from "./pages/UserProfilePage";
import ChatListPage from "./pages/ChatListPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatListPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
}