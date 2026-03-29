"use client";

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import type { UpdateUserRequest, UserProfile } from "../api";
import { usersApi } from "../api";
import { clearAuthSession, setStoredUser } from "../auth/storage";

const ACCENT = "#3b82f6";
const TEXT_MUTED = "#8f9fb8";
const TEXT_PRIMARY = "#e2e8f0";
const CARD_BACKGROUND = "rgba(11, 27, 56, 0.92)";

type UserProfilePageProps = {
  onClose?: () => void;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Не удалось выполнить запрос";
}

export default function UserProfilePage({ onClose }: UserProfilePageProps = {}) {
  const navigate = useNavigate();
  const close = onClose ?? (() => navigate("/"));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<UpdateUserRequest>({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const me = await usersApi.getMe();

        if (!cancelled) {
          setUser(me);
          setForm({
            firstName: me.firstName,
            lastName: me.lastName,
            phone: me.phone,
            bio: me.bio,
            avatarUrl: me.avatarUrl,
          });
          setStoredUser(me);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !user) {
      return;
    }

    try {
      const updated = await usersApi.updateAvatar(user.id, file);
      setUser(updated);
      setStoredUser(updated);
      setForm((prev) => ({ ...prev, avatarUrl: updated.avatarUrl }));
      setError("");
    } catch (avatarError) {
      setError(getErrorMessage(avatarError));
    } finally {
      event.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!user) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updated = await usersApi.update(user.id, form);
      setUser(updated);
      setStoredUser(updated);
      setEditing(false);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!user) {
      return;
    }

    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
    });
    setEditing(false);
    setError("");
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate("/auth", { replace: true });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={420}>
        <CircularProgress sx={{ color: ACCENT }} />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ p: 4, minWidth: 320 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || "Не удалось загрузить профиль"}
        </Alert>
        <Button variant="contained" onClick={handleLogout} sx={{ bgcolor: ACCENT }}>
          Выйти
        </Button>
      </Box>
    );
  }

  const infoRows = [
    { icon: <PhoneIcon fontSize="small" />, label: "Phone", value: user.phone || "—" },
    { icon: <AccountCircleIcon fontSize="small" />, label: "Username", value: user.username || "—" },
    { icon: <EmailIcon fontSize="small" />, label: "Email", value: user.email || "—" },
    {
      icon: <PersonIcon fontSize="small" />,
      label: "Full Name",
      value: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "—",
    },
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
            <Avatar src={user.avatarUrl} sx={{ width: 110, height: 110 }}>
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
            {user.firstName || user.username} {user.lastName}
          </Typography>
          <Typography variant="body2" sx={{ color: TEXT_MUTED, mb: 1.5 }}>
            @{user.username}
          </Typography>
          <Box sx={{ mt: 2, display: "flex", justifyContent: "center", gap: 1, flexWrap: "wrap" }}>
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
                  disabled={saving}
                  sx={{ bgcolor: ACCENT, color: "#fff", "&:hover": { bgcolor: "#2563eb" } }}
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  onClick={() => setEditing(true)}
                  sx={{ bgcolor: ACCENT, color: "#fff", "&:hover": { bgcolor: "#2563eb" } }}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleLogout}
                  sx={{
                    color: "#fda4af",
                    borderColor: "rgba(244,63,94,0.35)",
                    "&:hover": { borderColor: "rgba(244,63,94,0.55)" },
                  }}
                >
                  Logout
                </Button>
              </>
            )}
          </Box>
        </Box>

        {error && (
          <Box sx={{ px: 2, pb: 1 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

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
                label="Phone"
                name="phone"
                value={form.phone ?? ""}
                onChange={handleChange}
                size="small"
                fullWidth
                InputProps={{ sx: { color: TEXT_PRIMARY, bgcolor: "#0b1b36" } }}
              />
              <TextField
                label="Bio"
                name="bio"
                value={form.bio ?? ""}
                onChange={handleChange}
                size="small"
                fullWidth
                multiline
                minRows={3}
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
                  gap: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <Box sx={{ color: ACCENT }}>{row.icon}</Box>
                  <Typography
                    sx={{
                      color: TEXT_MUTED,
                      fontSize: "0.76rem",
                      textTransform: "uppercase",
                      fontWeight: 700,
                    }}
                  >
                    {row.label}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    color: TEXT_PRIMARY,
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    textAlign: "right",
                  }}
                >
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
