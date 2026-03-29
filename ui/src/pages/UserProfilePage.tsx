"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { usersApi, type UpdateUserRequest, type UserProfile } from "../api";

const ACCENT = "#3b82f6";
const TEXT_MUTED = "#8f9fb8";
const TEXT_PRIMARY = "#e2e8f0";
const CARD_BACKGROUND = "rgba(11, 27, 56, 0.92)";

type UserProfilePageProps = {
  onClose?: () => void;
  userId?: number;
  readOnly?: boolean;
};

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const isOnline = useMemo(() => {
    if (!user?.lastSeenAt) {
      return false;
    }

    return Date.now() - new Date(user.lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;
  }, [user?.lastSeenAt]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || isReadOnly) {
      return;
    }

    try {
      setSaving(true);
      const updatedUser = await usersApi.updateAvatar(user.id, file);
      setUser(updatedUser);
      setForm(updatedUser);
    } catch (avatarError) {
      setError(avatarError instanceof Error ? avatarError.message : "Failed to update avatar");
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  };

  const handleSave = async () => {
    const payload: UpdateUserRequest = {
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      bio: form.bio,
      avatarUrl: form.avatarUrl,
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
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      status: user.status,
    });
    setEditing(false);
    setError(null);
  };

  const formatLastSeen = (dateString?: string) => {
    if (!dateString) return "—";

    const date = new Date(dateString);
    const diff = Date.now() - date.getTime();
    const day = 86_400_000;
    const year = day * 365;

    if (diff < day) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    if (diff < year) {
      return date.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
    }

    return date.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "2-digit" });
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
      value: (editing ? form.phone : user.phone) || "—",
    },
    {
      icon: <AccountCircleIcon fontSize="small" />,
      label: "Username",
      value: `@${(editing ? form.username : user.username) || "unknown"}`,
    },
    {
      icon: <EmailIcon fontSize="small" />,
      label: "Email",
      value: (editing ? form.email : user.email) || "—",
    },
    {
      icon: <PersonIcon fontSize="small" />,
      label: "Full Name",
      value:
        [editing ? form.firstName : user.firstName, editing ? form.lastName : user.lastName]
          .filter(Boolean)
          .join(" ") || "—",
    },
    {
      icon: <InfoOutlinedIcon fontSize="small" />,
      label: "Bio",
      value: (editing ? form.bio : user.bio) || "—",
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
            <Avatar src={form.avatarUrl ?? user.avatarUrl} sx={{ width: 110, height: 110 }}>
              {user.username?.[0]?.toUpperCase() ?? "U"}
            </Avatar>
            {!isReadOnly && editing && (
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
            {!isReadOnly && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarChange}
              />
            )}
          </Box>
          <Typography variant="h5" sx={{ color: TEXT_PRIMARY, fontWeight: 800, mb: 0.5 }}>
            {fullName}
          </Typography>
          <Typography variant="body2" sx={{ color: TEXT_MUTED, mb: 1.5 }}>
            @{user.username}
          </Typography>

          <Chip
            label={isOnline ? "● Online" : `Last seen ${formatLastSeen(user.lastSeenAt)}`}
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
