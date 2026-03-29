import { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import type { UserProfile } from "../api";
import { usersApi } from "../api";
import { clearAuthSession, getStoredUser, setStoredUser } from "../auth/storage";
import { useNavigate } from "react-router-dom";
import UserProfilePage from "./UserProfilePage";

const conversations = [
  { id: 2, name: "Alice", lastMessage: "Как дела?" },
  { id: 3, name: "Bob", lastMessage: "Видишь экран?" },
  { id: 4, name: "Carol", lastMessage: "Пойдём на кофе" },
];

const palette = {
  shell: "#0b1222",
  panel: "rgba(11, 27, 56, 0.9)",
  panelBorder: "rgba(255,255,255,0.08)",
  accent: "#3b82f6",
  accentSoft: "rgba(59,130,246,0.12)",
  muted: "#64748b",
  text: "#fff",
};

export default function ChatListPage() {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(getStoredUser());
  const [loadingUser, setLoadingUser] = useState(!getStoredUser());

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      setLoadingUser(true);

      try {
        const me = await usersApi.getMe();

        if (!cancelled) {
          setCurrentUser(me);
          setStoredUser(me);
        }
      } catch {
        if (!cancelled) {
          clearAuthSession();
          navigate("/auth", { replace: true });
        }
      } finally {
        if (!cancelled) {
          setLoadingUser(false);
        }
      }
    };

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleLogout = () => {
    clearAuthSession();
    navigate("/auth", { replace: true });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        height: "100vh",
        bgcolor: palette.shell,
        color: palette.text,
        display: "flex",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          flex: "0 0 33%",
          maxWidth: 520,
          minWidth: 360,
          height: "100vh",
          bgcolor: palette.panel,
          borderRight: `1px solid ${palette.panelBorder}`,
          display: "flex",
          flexDirection: "column",
          boxShadow: "4px 0 20px rgba(0,0,0,0.35)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1.5,
            borderBottom: `1px solid ${palette.panelBorder}`,
            gap: 2,
            flexShrink: 0,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              src={currentUser?.avatarUrl}
              sx={{ width: 42, height: 42, bgcolor: palette.accentSoft, color: "#bfdbfe" }}
            >
              {currentUser?.username?.[0]?.toUpperCase() ?? "U"}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1rem", color: "#fff" }}>
                Чаты
              </Typography>
              <Typography sx={{ color: palette.muted, fontSize: "0.85rem" }}>
                {currentUser ? `@${currentUser.username}` : "Загрузка профиля"}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Tooltip title="Профиль">
              <IconButton
                color="inherit"
                onClick={() => setProfileOpen(true)}
                sx={{
                  color: palette.accent,
                  "&:hover": { bgcolor: palette.accentSoft },
                }}
              >
                <AccountCircleIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Выйти">
              <IconButton
                color="inherit"
                onClick={handleLogout}
                sx={{
                  color: "#fda4af",
                  "&:hover": { bgcolor: "rgba(244,63,94,0.1)" },
                }}
              >
                <LogoutRoundedIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        <Box sx={{ flex: 1, overflow: "auto", p: 1 }}>
          <List sx={{ bgcolor: "transparent" }}>
            {conversations.map((chat) => (
              <ListItemButton
                key={chat.id}
                onClick={() => window.alert(`Открыть чат с ${chat.name}`)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  "&:hover": { bgcolor: "rgba(59,130,246,0.15)" },
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: "#3f51b5", mr: 1 }}>{chat.name[0]}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography sx={{ color: "#fff", fontWeight: 500 }}>{chat.name}</Typography>
                  }
                  secondary={
                    <Typography sx={{ color: palette.muted, fontSize: "0.85rem" }}>
                      {chat.lastMessage}
                    </Typography>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Box>

      <Box
        sx={{
          flex: "1 1 auto",
          minWidth: 0,
          bgcolor: "#0a1628",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at top right, rgba(59,130,246,0.12), transparent 24%), linear-gradient(180deg, #0a1628 0%, #09111f 100%)",
        }}
      >
        {loadingUser ? (
          <Stack spacing={2} alignItems="center">
            <CircularProgress sx={{ color: palette.accent }} />
            <Typography sx={{ color: palette.muted, fontSize: "1rem" }}>
              Загружаем ваш аккаунт
            </Typography>
          </Stack>
        ) : (
          <Box sx={{ maxWidth: 520, px: 4 }}>
            <Typography
              sx={{
                color: "#e2e8f0",
                fontSize: { xs: "2rem", md: "3rem" },
                fontWeight: 800,
                lineHeight: 1.05,
                mb: 2,
              }}
            >
              Добро пожаловать{currentUser?.firstName ? `, ${currentUser.firstName}` : ""}.
            </Typography>
            <Typography sx={{ color: palette.muted, fontSize: "1.1rem", lineHeight: 1.75 }}>
              Токен уже сохранён локально, а все запросы из общего API-клиента автоматически
              получают заголовок `Authorization: Bearer ...`. Можно открывать профиль и работать
              дальше с защищёнными эндпоинтами.
            </Typography>
          </Box>
        )}
      </Box>

      <Dialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        maxWidth="xs"
        PaperProps={{
          sx: {
            bgcolor: "transparent",
            boxShadow: "none",
            borderRadius: 3,
            minWidth: 320,
            maxWidth: 620,
            mx: "auto",
            maxHeight: "calc(100vh - 48px)",
            overflow: "hidden",
          },
        }}
        BackdropProps={{
          sx: {
            bgcolor: "rgba(4, 8, 16, 0.75)",
            backdropFilter: "blur(3px)",
          },
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <UserProfilePage onClose={() => setProfileOpen(false)} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
