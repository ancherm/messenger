import React, { useState } from "react";
import { Box, Typography, List, ListItemButton, ListItemAvatar, Avatar, ListItemText, IconButton, Dialog, DialogContent } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import UserProfilePage from "./UserProfilePage";

const conversations = [
  { id: 2, name: "Alice", lastMessage: "Как дела?" },
  { id: 3, name: "Bob", lastMessage: "Видишь экран?" },
  { id: 4, name: "Carol", lastMessage: "Пойдём на кофе" },
];

export default function ChatListPage() {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <Box sx={{ minHeight: "100vh", height: "100vh", bgcolor: "#0b1222", color: "#fff", display: "flex", width: "100%", margin: 0, padding: 0, minWidth: 0, overflow: "hidden" }}>
      {/* ── Боковая панель (чаты) ────────────────────────────────── */}
      <Box
        sx={{
          flex: "0 0 33%",
          maxWidth: 520,
          minWidth: 360,
          height: "100vh",
          bgcolor: "rgba(11, 27, 56, 0.85)",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "4px 0 20px rgba(0,0,0,0.35)",
          minWidth: 0,
        }}
      >
        {/* Шапка */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            px: 2,
            py: 1.5,
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            gap: 2,
            flexShrink: 0,
          }}
        >
          <IconButton
            color="inherit"
            onClick={() => setProfileOpen(true)}
            sx={{
              color: "#3b82f6",
              "&:hover": { bgcolor: "rgba(59,130,246,0.1)" },
            }}
          >
            <AccountCircleIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1rem", color: "#fff" }}>
            Чаты
          </Typography>
        </Box>

        {/* Список чатов */}
        <Box sx={{ flex: 1, overflow: "auto", p: 1 }}>
          <List sx={{ bgcolor: "transparent" }}>
            {conversations.map((chat) => (
              <ListItemButton
                key={chat.id}
                onClick={() => alert(`Открыть чат с ${chat.name}`)}
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
                  primary={<Typography sx={{ color: "#fff", fontWeight: 500 }}>{chat.name}</Typography>}
                  secondary={<Typography sx={{ color: "#64748b", fontSize: "0.85rem" }}>{chat.lastMessage}</Typography>}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Box>

      {/* ── Главная область (место для чата) ────────────────────── */}
      <Box
        sx={{
          flex: "1 1 auto",
          minWidth: 0,
          bgcolor: "#0a1628",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography sx={{ color: "#64748b", fontSize: "1.2rem" }}>
          Выберите чат
        </Typography>
      </Box>

      {/* ── Dialog с профилем ────────────────────────────────── */}
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
