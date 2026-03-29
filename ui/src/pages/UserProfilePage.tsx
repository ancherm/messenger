"use client";

import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Typography,
  Box,
  Divider,
  Chip,
  IconButton,
  Button,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

// ─── Константы темы ────────────────────────────────────────────
const ACCENT = "#3b82f6";
const TEXT_MUTED = "#8f9fb8";
const TEXT_PRIMARY = "#e2e8f0";
const CARD_BACKGROUND = "rgba(11, 27, 56, 0.92)";

// ─── Типы ──────────────────────────────────────────────────────
type User = {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  status?: string;
  lastSeenAt?: string;
  createdAt?: string;
  active?: boolean;
};

// ─── Конфиги секций ────────────────────────────────────────────

// ─── Главная страница ──────────────────────────────────────────
type UserProfilePageProps = {
  onClose?: () => void;
};

export default function UserProfilePage({ onClose }: UserProfilePageProps = {}) {
  const navigate = useNavigate();
  const close = onClose ?? (() => navigate("/"));
  const [user, setUser]       = useState<User | null>(null);
  const [form, setForm]       = useState<Partial<User>>({});
  const [editing, setEditing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const scheduleMockData = window.setTimeout(() => {
      const mockUser: User = {
        id: 1,
        username: "johndoe",
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
        phone: "+1234567890",
        avatarUrl: "https://i.pravatar.cc/150?img=3",
        status: "ONLINE",
        lastSeenAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - 86400 * 1000 * 90).toISOString(),
        active: true,
      };
      setUser(mockUser);
      setForm(mockUser);
    }, 0);

    return () => window.clearTimeout(scheduleMockData);
  }, []);

  useEffect(() => {
    const resetTimer = () => {
      setIsOnline(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setIsOnline(false);
        setUser((prev) => (prev ? { ...prev, lastSeenAt: new Date().toISOString() } : prev));
      }, 60_000);
    };
    const events = ["mousemove", "keydown", "click"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const avatarUrl = reader.result as string;
      setForm((prev) => ({ ...prev, avatarUrl }));
      setUser((prev) => (prev ? { ...prev, avatarUrl } : prev));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setUser((prev) => (prev ? { ...prev, ...(form as User) } : prev));
    setEditing(false);
  };

  const handleCancel = () => {
    setForm(user ?? {});
    setEditing(false);
  };

  const formatLastSeen = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const diff = new Date().getTime() - date.getTime();
    const DAY  = 86_400_000;
    const YEAR = DAY * 365;
    if (diff < DAY)  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diff < YEAR) return date.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
    return date.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "2-digit" });
  };

  if (!user)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography color={TEXT_MUTED}>Loading…</Typography>
      </Box>
    );

  const infoRows = [
    { icon: <PhoneIcon fontSize="small" />, label: "Phone",     value: (editing ? form.phone : user.phone) || "—" },
    { icon: <AccountCircleIcon fontSize="small" />, label: "Username",  value: (editing ? form.username : user.username) || "—" },
    { icon: <EmailIcon fontSize="small" />, label: "Email",     value: (editing ? form.email : user.email) || "—" },
    { icon: <PersonIcon fontSize="small" />, label: "Full Name", value: ((editing ? form.firstName : user.firstName) ?? "") + " " + ((editing ? form.lastName : user.lastName) ?? "") || "—" },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        minHeight: "100%",
        boxSizing: "border-box",
      }}
    >
      <Box
        sx={{
          width: "clamp(360px, 92%, 620px)",
          bgcolor: CARD_BACKGROUND,
          borderRadius: 3,
          overflow: "hidden",
          position: "relative",
          pb: 2,
          maxHeight: "calc(100vh - 60px)",
          overflowY: "auto",
        }}
      >
        <IconButton
          onClick={close}
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            color: "rgba(255,255,255,0.72)",
            zIndex: 2,
            bgcolor: "rgba(4,9,18,0.6)",
            "&:hover": { bgcolor: "rgba(5,10,20,0.85)" },
          }}
        >
          <CloseIcon />
        </IconButton>

        <Box sx={{ textAlign: "center", p: 3, pt: 8 }}>
          <Box sx={{ position: "relative", width: 110, height: 110, mx: "auto", mb: 1 }}>
            <Avatar
              src={form.avatarUrl ?? user.avatarUrl}
              sx={{ width: 110, height: 110 }}
            >
              {user.username?.[0]?.toUpperCase() ?? "U"}
            </Avatar>
            {editing && (
              <IconButton
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  position: "absolute",
                  bottom: -5,
                  right: -5,
                  bgcolor: "rgba(0,0,0,0.5)",
                  color: "#fff",
                  width: 32,
                  height: 32,
                  p: 0,
                  "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                }}
              >
                <AccountCircleIcon fontSize="small" />
              </IconButton>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />
          </Box>
          <Typography variant="h5" sx={{ color: TEXT_PRIMARY, fontWeight: 800, mb: 0.5 }}>
            {user.firstName} {user.lastName}
          </Typography>
          <Typography variant="body2" sx={{ color: TEXT_MUTED, mb: 1.5 }}>
            @{user.username}
          </Typography>

          <Chip
            label={isOnline ? "● Online" : `Last seen ${formatLastSeen(user.lastSeenAt)}`}
            sx={{
              bgcolor: isOnline ? "rgba(0,230,118,0.13)" : "rgba(255,255,255,0.06)",
              color: isOnline ? "#00e676" : TEXT_MUTED,
              border: isOnline ? "1px solid rgba(0,230,118,0.35)" : "1px solid rgba(255,255,255,0.11)",
              fontWeight: 700,
              fontSize: "0.68rem",
              minWidth: 148,
            }}
          />
          <Box sx={{ mt: 2, display: "flex", justifyContent: "center", gap: 1 }}>
            {editing ? (
              <>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  sx={{ color: TEXT_MUTED, borderColor: "rgba(255,255,255,0.2)" }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  sx={{ bgcolor: ACCENT, color: "#fff", '&:hover': { bgcolor: '#2563eb' } }}
                >
                  Save
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                onClick={() => setEditing(true)}
                sx={{ bgcolor: ACCENT, color: "#fff", '&:hover': { bgcolor: '#2563eb' } }}
              >
                Edit
              </Button>
            )}
          </Box>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.15)", mb: 1 }} />

        <Box sx={{ px: 2, py: 1 }}>
          {editing ? (
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="First Name"
                name="firstName"
                value={form.firstName ?? ""}
                onChange={handleChange}
                size="small"
                fullWidth
                InputProps={{ sx: { color: TEXT_PRIMARY, bgcolor: "#0b1b36" } }}
              />
              <TextField
                label="Last Name"
                name="lastName"
                value={form.lastName ?? ""}
                onChange={handleChange}
                size="small"
                fullWidth
                InputProps={{ sx: { color: TEXT_PRIMARY, bgcolor: "#0b1b36" } }}
              />
              <TextField
                label="Email"
                name="email"
                value={form.email ?? ""}
                onChange={handleChange}
                size="small"
                fullWidth
                InputProps={{ sx: { color: TEXT_PRIMARY, bgcolor: "#0b1b36" } }}
              />
              <TextField
                label="Phone"
                name="phone"
                value={form.phone ?? ""}
                onChange={handleChange}
                size="small"
                fullWidth
                InputProps={{ sx: { color: TEXT_PRIMARY, bgcolor: "#0b1b36" } }}
              />
            </Box>
          ) : (
            infoRows.map((row) => (
              <Box
                key={row.label}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 1,
                  px: 1.5,
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <Box sx={{ color: ACCENT }}>{row.icon}</Box>
                  <Typography sx={{ color: TEXT_MUTED, fontSize: "0.76rem", textTransform: "uppercase", fontWeight: 700 }}>
                    {row.label}
                  </Typography>
                </Box>
                <Typography sx={{ color: TEXT_PRIMARY, fontWeight: 600, fontSize: "0.95rem" }}>
                  {row.value}
                </Typography>
              </Box>
            ))
          )}
        </Box>
      </Box>
    </Box>
  );
}

// ─── Вспомогательные компоненты ────────────────────────────────
