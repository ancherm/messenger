"use client";

import React, { useEffect, useState, useRef } from "react";
import type { ChangeEvent } from "react";
import {
  Avatar,
  TextField,
  Button,
  Typography,
  Box,
  Divider,
  Chip,
  InputAdornment,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LinkIcon from "@mui/icons-material/Link";
import BadgeIcon from "@mui/icons-material/Badge";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

// ─── Константы темы ────────────────────────────────────────────
const ACCENT = "#3b82f6";
const CARD_BG = "#0a1628";
const FIELD_BG = "#060d1a";
const TEXT_MUTED = "#64748b";
const GRADIENT = "linear-gradient(135deg, #000000 0%, #0a1628 50%, #1e3a5f 100%)";

// ─── Типы ──────────────────────────────────────────────────────
type User = {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  lastSeenAt?: string;
};

type FieldConfig = {
  label: string;
  name: keyof User;
  icon: React.ReactNode;
  fullWidth?: boolean;
};

type FieldProps = FieldConfig & {
  value?: string;
  editing: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

// ─── Компонент поля ────────────────────────────────────────────
const Field: React.FC<FieldProps> = ({ label, name, value, editing, onChange, icon }) => (
  <Box display="flex" flexDirection="row" alignItems="center" justifyContent="space-between" width="100%">
    <Typography
      variant="caption"
      sx={{
        color: TEXT_MUTED,
        fontWeight: 700,
        letterSpacing: 1,
        textTransform: "uppercase",
        fontSize: "0.7rem",
        minWidth: 120,
        textAlign: "left",
      }}
    >
      {label}
    </Typography>

    {editing ? (
      <TextField
        name={name}
        value={value || ""}
        onChange={onChange}
        variant="outlined"
        size="small"
        sx={{
          flex: 1,
          maxWidth: 300,
          "& .MuiInputBase-input": { color: "white", py: 1 },
          "& .MuiOutlinedInput-root": {
            bgcolor: FIELD_BG,
            borderRadius: 2,
            transition: "box-shadow 0.2s",
            "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
            "&:hover fieldset": { borderColor: ACCENT },
            "&.Mui-focused fieldset": { borderColor: ACCENT },
            "&.Mui-focused": { boxShadow: `0 0 0 3px rgba(124,77,255,0.15)` },
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Box sx={{ color: ACCENT, display: "flex", opacity: 0.8 }}>{icon}</Box>
            </InputAdornment>
          ),
        }}
      />
    ) : (
      <Box display="flex" alignItems="center" gap={1} sx={{ flex: 1, maxWidth: 300, justifyContent: "flex-start" }}>
        <Box sx={{ color: ACCENT, display: "flex", opacity: 0.6 }}>{icon}</Box>
        <Typography variant="body2" sx={{ color: "white", fontWeight: 500 }}>
          {value || "—"}
        </Typography>
      </Box>
    )}
  </Box>
);

// ─── Конфиги секций ────────────────────────────────────────────
const PERSONAL_FIELDS: FieldConfig[] = [
  { label: "Username",   name: "username",  icon: <AccountCircleIcon fontSize="small" /> },
  { label: "First Name", name: "firstName", icon: <BadgeIcon fontSize="small" /> },
  { label: "Last Name",  name: "lastName",  icon: <BadgeIcon fontSize="small" /> },
];

const CONTACT_FIELDS: FieldConfig[] = [
  { label: "Email",      name: "email",     icon: <EmailIcon fontSize="small" /> },
  { label: "Phone",      name: "phone",     icon: <PhoneIcon fontSize="small" /> },
  { label: "Avatar URL", name: "avatarUrl", icon: <LinkIcon fontSize="small" />, fullWidth: true },
];

// ─── Главная страница ──────────────────────────────────────────
export default function UserProfilePage() {
  const [user, setUser]       = useState<User | null>(null);
  const [form, setForm]       = useState<Partial<User>>({});
  const [editing, setEditing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const mockUser: User = {
      id: 1,
      username: "johndoe",
      email: "john@example.com",
      firstName: "John",
      lastName: "Doe",
      phone: "+1234567890",
      avatarUrl: "https://i.pravatar.cc/150?img=3",
      lastSeenAt: new Date().toISOString(),
    };
    setUser(mockUser);
    setForm(mockUser);
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

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setUser(form as User);
    setEditing(false);
  };

  const handleCancel = () => {
    setForm(user as User); // ← сброс несохранённых изменений
    setEditing(false);
  };

  const formatLastSeen = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const diff = Date.now() - date.getTime();
    const DAY  = 86_400_000;
    const YEAR = DAY * 365;
    if (diff < DAY)  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diff < YEAR) return date.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
    return date.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "2-digit" });
  };

  if (!user)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#0d0d1a">
        <Typography color={TEXT_MUTED}>Loading…</Typography>
      </Box>
    );

  // ─── Разметка ────────────────────────────────────────────────
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ background: "linear-gradient(160deg, #000000 0%, #0a1628 50%, #1e3a5f 100%)", p: 3 }}
    >
      <Box
        sx={{
          maxWidth: 600,
          width: "100%",
          borderRadius: 4,
          overflow: "hidden",
          bgcolor: CARD_BG,
          border: "1px solid rgba(124,77,255,0.2)",
          boxShadow: "0 30px 60px rgba(0,0,0,0.6), 0 0 40px rgba(124,77,255,0.08)",
        }}
      >
        {/* ── Аватар + имя ───────────────────────────────────── */}
        <Box display="flex" flexDirection="column" alignItems="center" sx={{ mt: 3, mb: 3 }}>
          <Avatar
            src={user.avatarUrl}
            sx={{ width: 100, height: 100, fontSize: "2.2rem", bgcolor: "#333" }}
          >
            {user.username[0].toUpperCase()}
          </Avatar>

          {/* Индикатор онлайн */}
          <Box
            sx={{
              width: 16, height: 16, borderRadius: "50%",
              bgcolor: isOnline ? "#00e676" : "#616161",
              border: `3px solid ${CARD_BG}`,
              boxShadow: isOnline ? "0 0 10px #00e676" : "none",
              mt: -2, ml: 8,
              transition: "all 0.4s ease",
              zIndex: 2,
            }}
          />

          <Typography variant="h5" sx={{ color: "white", fontWeight: 800, mt: 1.5, letterSpacing: 0.5 }}>
            {user.firstName} {user.lastName}
          </Typography>

          <Typography variant="body2" sx={{ color: TEXT_MUTED, mb: 1.5 }}>
            @{user.username}
          </Typography>

          <Chip
            size="small"
            label={isOnline ? "● Online" : `Last seen ${formatLastSeen(user.lastSeenAt)}`}
            sx={{
              bgcolor:     isOnline ? "rgba(0,230,118,0.12)" : "rgba(255,255,255,0.07)",
              color:       isOnline ? "#00e676"              : TEXT_MUTED,
              border:      `1px solid ${isOnline ? "rgba(0,230,118,0.35)" : "rgba(255,255,255,0.1)"}`,
              fontWeight:  700,
              fontSize:    "0.68rem",
              letterSpacing: 0.5,
            }}
          />
        </Box>

        {/* ── Контент ────────────────────────────────────────── */}
        <Box sx={{ px: 4, pb: 4 }}>

          {/* Секция: Personal */}
          <SectionHeader icon={<PersonIcon sx={{ fontSize: 16 }} />} title="Personal Information" />
          <Box display="flex" flexDirection="column" gap={2} mb={3} alignItems="flex-start" width="100%">
            {PERSONAL_FIELDS.map(({ label, name, icon }) => (
              <Box key={name} width="100%">
                <Field label={label} name={name} value={form[name] as string} editing={editing} onChange={handleChange} icon={icon} />
              </Box>
            ))}
          </Box>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.07)", mb: 3 }} />

          {/* Секция: Contact */}
          <SectionHeader icon={<EmailIcon sx={{ fontSize: 16 }} />} title="Contact Information" />
          <Box display="flex" flexDirection="column" gap={2} mb={4} alignItems="flex-start" width="100%">
            {CONTACT_FIELDS.map(({ label, name, icon }) => (
              <Box key={name} width="100%">
                <Field label={label} name={name} value={form[name] as string} editing={editing} onChange={handleChange} icon={icon} />
              </Box>
            ))}
          </Box>

          {/* ── Кнопки ─────────────────────────────────────── */}
          <Box display="flex" justifyContent="flex-end" gap={2}>
            {editing ? (
              <>
                <Button
                  variant="outlined"
                  startIcon={<CloseIcon />}
                  onClick={handleCancel}
                  sx={{
                    color: TEXT_MUTED,
                    borderColor: "rgba(255,255,255,0.15)",
                    borderRadius: 2,
                    "&:hover": { borderColor: "rgba(255,255,255,0.35)", bgcolor: "rgba(255,255,255,0.05)" },
                  }}
                >
                  Cancel
                </Button>
                <GradientButton startIcon={<SaveIcon />} onClick={handleSave}>
                  Save Changes
                </GradientButton>
              </>
            ) : (
              <GradientButton startIcon={<EditIcon />} onClick={() => setEditing(true)}>
                Edit Profile
              </GradientButton>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Вспомогательные компоненты ────────────────────────────────

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Box display="flex" alignItems="center" gap={1} mb={2}>
      <Box sx={{ color: ACCENT, display: "flex" }}>{icon}</Box>
      <Typography
        variant="caption"
        sx={{ color: TEXT_MUTED, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", fontSize: "0.68rem" }}
      >
        {title}
      </Typography>
    </Box>
  );
}

function GradientButton({
  children,
  startIcon,
  onClick,
}: {
  children: React.ReactNode;
  startIcon?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      variant="contained"
      startIcon={startIcon}
      onClick={onClick}
      sx={{
        background: GRADIENT,
        borderRadius: 2,
        fontWeight: 700,
        px: 3,
        boxShadow: "0 4px 18px rgba(124,77,255,0.45)",
        transition: "all 0.2s ease",
        "&:hover": {
          boxShadow: "0 6px 24px rgba(124,77,255,0.65)",
          transform: "translateY(-2px)",
          background: GRADIENT,
        },
        "&:active": { transform: "translateY(0)" },
      }}
    >
      {children}
    </Button>
  );
}
