"use client";

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
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
import LinkIcon from "@mui/icons-material/Link";
import { usersApi, type UpdateUserRequest, type UserProfile } from "../api";
import { subscribeUserStatusChanged } from "../presence/presenceEvents";

const ACCENT = "#3b82f6";
const TEXT_MUTED = "#8f9fb8";
const TEXT_PRIMARY = "#e2e8f0";
const CARD_BACKGROUND = "rgba(11, 27, 56, 0.92)";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    color: TEXT_PRIMARY,
    bgcolor: "#0b1b36",
    "& fieldset": {
      borderColor: "rgba(255,255,255,0.14)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(59,130,246,0.42)",
    },
    "&.Mui-focused fieldset": {
      borderColor: ACCENT,
    },
  },
  "& .MuiInputLabel-root": {
    color: TEXT_MUTED,
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#93c5fd",
  },
  "& .MuiInputBase-input::placeholder": {
    color: "rgba(226,232,240,0.48)",
    opacity: 1,
  },
};

type UserProfilePageProps = {
  onClose?: () => void;
  userId?: number;
  readOnly?: boolean;
};

export default function UserProfilePage({
  onClose,
  userId,
  readOnly = false,
}: UserProfilePageProps = {}) {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const close = onClose ?? (() => navigate("/"));
  const resolvedUserId = userId ?? (params.id ? Number(params.id) : undefined);
  const isReadOnly = readOnly || resolvedUserId !== undefined;
  const [user, setUser] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<Partial<UserProfile>>({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      setLoading(true);
      setError(null);

      try {
        const profile = resolvedUserId
          ? await usersApi.getById(resolvedUserId)
          : await usersApi.getMe();

        if (!active) {
          return;
        }

        setUser(profile);
        setForm(profile);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load profile");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadUser();

    return () => {
      active = false;
    };
  }, [resolvedUserId]);

  useEffect(() => {
    if (isReadOnly) {
      return;
    }

    return subscribeUserStatusChanged((detail) => {
      setUser((prev) =>
        prev
          ? {
              ...prev,
              status: detail.status,
              active: detail.active,
              lastSeenAt:
                detail.status === "OFFLINE" ? detail.lastSeenAt ?? prev.lastSeenAt : prev.lastSeenAt,
            }
          : prev
      );
      setForm((prev) => ({
        ...prev,
        status: detail.status,
      }));
    });
  }, [isReadOnly]);

  const isOnline = !!user && (user.status === "ONLINE" || user.active);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const payload: UpdateUserRequest = {
      email: form.email?.trim() || undefined,
      firstName: form.firstName?.trim() || undefined,
      lastName: form.lastName?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
      avatarUrl: form.avatarUrl?.trim() || undefined,
      status: form.status,
    };

    try {
      setSaving(true);
      setError(null);
      const updatedUser = await usersApi.updateMe(payload);
      setUser(updatedUser);
      setForm(updatedUser);
      setEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!user) {
      return;
    }

    setForm({
      email: user.email ?? undefined,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      status: user.status,
    });
    setEditing(false);
    setError(null);
  };

  const formatLastSeen = (dateString?: string) => {
    if (!dateString) {
      return "-";
    }

    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography color={TEXT_MUTED}>Loading...</Typography>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" px={3}>
        <Typography color={TEXT_MUTED}>{error ?? "Profile not found"}</Typography>
      </Box>
    );
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Unnamed user";
  const infoRows = [
    {
      icon: <PhoneIcon fontSize="small" />,
      label: "Phone",
      value: user.phone || "-",
    },
    {
      icon: <AccountCircleIcon fontSize="small" />,
      label: "Username",
      value: `@${user.username || "unknown"}`,
    },
    {
      icon: <EmailIcon fontSize="small" />,
      label: "Email",
      value: user.email || "-",
    },
    {
      icon: <PersonIcon fontSize="small" />,
      label: "Full Name",
      value: [user.firstName, user.lastName].filter(Boolean).join(" ") || "-",
    },
  ];

  if (!isReadOnly) {
    infoRows.push({
      icon: <LinkIcon fontSize="small" />,
      label: "Avatar URL",
      value: user.avatarUrl || "-",
    });
  }

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
            <Avatar src={form.avatarUrl ?? user.avatarUrl} sx={{ width: 110, height: 110 }}>
              {user.username?.[0]?.toUpperCase() ?? "U"}
            </Avatar>
          </Box>
          <Typography variant="h5" sx={{ color: TEXT_PRIMARY, fontWeight: 800, mb: 0.5 }}>
            {fullName}
          </Typography>
          <Typography variant="body2" sx={{ color: TEXT_MUTED, mb: 1.5 }}>
            @{user.username}
          </Typography>

          <Chip
            label={isOnline ? "Online" : `Last seen ${formatLastSeen(user.lastSeenAt)}`}
            sx={{
              bgcolor: isOnline ? "rgba(0,230,118,0.13)" : "rgba(255,255,255,0.06)",
              color: isOnline ? "#00e676" : TEXT_MUTED,
              border: isOnline
                ? "1px solid rgba(0,230,118,0.35)"
                : "1px solid rgba(255,255,255,0.11)",
              fontWeight: 700,
              fontSize: "0.68rem",
              minWidth: 148,
            }}
          />

          <Box sx={{ mt: 2, display: "flex", justifyContent: "center", gap: 1 }}>
            {isReadOnly ? (
              <Chip
                label="Read only"
                sx={{
                  bgcolor: "rgba(59,130,246,0.12)",
                  color: "#93c5fd",
                  border: "1px solid rgba(59,130,246,0.28)",
                  fontWeight: 700,
                }}
              />
            ) : editing ? (
              <>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={saving}
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
              <Button
                variant="contained"
                onClick={() => setEditing(true)}
                sx={{ bgcolor: ACCENT, color: "#fff", "&:hover": { bgcolor: "#2563eb" } }}
              >
                Edit
              </Button>
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
          {!isReadOnly && editing ? (
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="First Name"
                name="firstName"
                value={form.firstName ?? ""}
                onChange={handleChange}
                size="small"
                fullWidth
                sx={fieldSx}
              />
              <TextField
                label="Last Name"
                name="lastName"
                value={form.lastName ?? ""}
                onChange={handleChange}
                size="small"
                fullWidth
                sx={fieldSx}
              />
              <TextField
                label="Email"
                name="email"
                value={form.email ?? ""}
                onChange={handleChange}
                size="small"
                fullWidth
                sx={fieldSx}
              />
              <TextField
                label="Phone"
                name="phone"
                value={form.phone ?? ""}
                onChange={handleChange}
                size="small"
                fullWidth
                sx={fieldSx}
              />
              <TextField
                label="Avatar URL"
                name="avatarUrl"
                value={form.avatarUrl ?? ""}
                onChange={handleChange}
                size="small"
                fullWidth
                placeholder="https://example.com/avatar.png"
                sx={fieldSx}
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
                  gap: 2,
                  py: 1,
                  px: 1.5,
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
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
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
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
