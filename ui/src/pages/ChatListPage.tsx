import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useNavigate } from "react-router-dom";
import { clearAuthSession } from "../auth/storage";
import { chatsApi, messagesApi, usersApi, type Chat, type Message, type UserProfile } from "../api";
import UserProfilePage from "./UserProfilePage";

type ConversationItem = {
  chatId: number;
  userId?: number;
  name: string;
  lastMessage: string;
  avatarUrl?: string;
};

const CHAT_REFRESH_MS = 5000;
const MESSAGE_REFRESH_MS = 3000;

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
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [chatListError, setChatListError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = useCallback(() => {
    void (async () => {
      try {
        await usersApi.updateStatus("OFFLINE");
      } catch {
        // Ignore presence update errors on logout.
      } finally {
        clearAuthSession();
        navigate("/auth", { replace: true });
      }
    })();
  }, [navigate]);

  const loadChats = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoadingChats(true);
      }
      setChatListError(null);

      try {
        const [me, chats] = await Promise.all([usersApi.getMe(), chatsApi.getAll()]);
        const mapped = await Promise.all(chats.map((chat) => mapConversation(chat, me)));
        const nextConversations = mapped.filter(isValidConversationItem);

        setCurrentUser(me);
        setConversations(nextConversations);
        setSelectedChatId((prev) => {
          if (isValidChatId(prev) && nextConversations.some((item) => item.chatId === prev)) {
            return prev;
          }

          return nextConversations[0]?.chatId ?? null;
        });
      } catch (loadError) {
        if (isUnauthorizedError(loadError)) {
          handleLogout();
          return;
        }

        setChatListError(loadError instanceof Error ? loadError.message : "Failed to load chats");
      } finally {
        if (!silent) {
          setLoadingChats(false);
        }
      }
    },
    [handleLogout]
  );

  const loadMessages = useCallback(async (chatId: number, silent = false) => {
    if (!silent) {
      setLoadingMessages(true);
    }
    setMessagesError(null);

    try {
      const history = await messagesApi.getChatHistory(chatId, { limit: 50 });
      setMessages(sortMessages(history));
    } catch (loadError) {
      setMessagesError(loadError instanceof Error ? loadError.message : "Failed to load messages");
    } finally {
      if (!silent) {
        setLoadingMessages(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadChats();
  }, [loadChats]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadChats(true);
    }, CHAT_REFRESH_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadChats]);

  useEffect(() => {
    if (!isValidChatId(selectedChatId)) {
      setMessages([]);
      setMessagesError(null);
      return;
    }

    void loadMessages(selectedChatId);
  }, [loadMessages, selectedChatId]);

  useEffect(() => {
    if (!isValidChatId(selectedChatId)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadMessages(selectedChatId, true);
    }, MESSAGE_REFRESH_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadMessages, selectedChatId]);

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.chatId === selectedChatId) ?? null,
    [conversations, selectedChatId]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, selectedChatId]);

  const handleSendMessage = async () => {
    if (!selectedChatId || !draft.trim() || sending) {
      return;
    }

    try {
      setSending(true);
      setMessagesError(null);
      const newMessage = await messagesApi.send(selectedChatId, {
        content: draft.trim(),
        contentType: "TEXT",
      });

      setMessages((prev) => sortMessages([...prev, newMessage]));
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.chatId === selectedChatId
            ? { ...conversation, lastMessage: newMessage.content }
            : conversation
        )
      );
      setDraft("");
    } catch (sendError) {
      setMessagesError(sendError instanceof Error ? sendError.message : "Failed to send message");
    } finally {
      setSending(false);
    }
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
        margin: 0,
        padding: 0,
        minWidth: 0,
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
          {loadingChats ? (
            <Typography sx={{ color: palette.muted, p: 2 }}>Загрузка чатов...</Typography>
          ) : chatListError ? (
            <Typography sx={{ color: "#fca5a5", p: 2 }}>{chatListError}</Typography>
          ) : (
            <List sx={{ bgcolor: "transparent" }}>
              {conversations.map((chat) => (
                <ListItemButton
                  key={`${chat.chatId}-${chat.userId ?? chat.name}`}
                  onClick={() => setSelectedChatId(chat.chatId)}
                  selected={chat.chatId === selectedChatId}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    pr: 1,
                    bgcolor:
                      chat.chatId === selectedChatId ? "rgba(59,130,246,0.18)" : "transparent",
                    "&.Mui-selected": {
                      bgcolor: "rgba(59,130,246,0.18)",
                    },
                    "&.Mui-selected:hover": {
                      bgcolor: "rgba(59,130,246,0.22)",
                    },
                    "&:hover": { bgcolor: "rgba(59,130,246,0.15)" },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={chat.avatarUrl} sx={{ bgcolor: "#3f51b5", mr: 1 }}>
                      {chat.name[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography sx={{ color: "#fff", fontWeight: 500 }}>{chat.name}</Typography>}
                    secondary={
                      <Typography sx={{ color: palette.muted, fontSize: "0.85rem" }}>
                        {chat.lastMessage}
                      </Typography>
                    }
                  />
                  {chat.userId && (
                    <IconButton
                      edge="end"
                      aria-label={`Открыть профиль ${chat.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedUserId(chat.userId ?? null);
                      }}
                      sx={{
                        color: "#93c5fd",
                        ml: 1,
                        "&:hover": { bgcolor: "rgba(59,130,246,0.12)" },
                      }}
                    >
                      <VisibilityOutlinedIcon fontSize="small" />
                    </IconButton>
                  )}
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          flex: "1 1 auto",
          minWidth: 0,
          bgcolor: "#0a1628",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {!selectedConversation ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography sx={{ color: palette.muted, fontSize: "1.2rem" }}>Выберите чат</Typography>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                px: 3,
                py: 2,
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Avatar src={selectedConversation.avatarUrl} sx={{ width: 44, height: 44 }}>
                {selectedConversation.name[0]}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: "#fff", fontWeight: 700 }}>
                  {selectedConversation.name}
                </Typography>
                <Typography sx={{ color: palette.muted, fontSize: "0.85rem" }}>
                  Личная переписка
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                flex: 1,
                overflow: "auto",
                px: 3,
                py: 2,
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                background:
                  "radial-gradient(circle at top, rgba(59,130,246,0.08), transparent 32%), #0a1628",
              }}
            >
              {loadingMessages ? (
                <Typography sx={{ color: palette.muted }}>Загрузка сообщений...</Typography>
              ) : messagesError ? (
                <Typography sx={{ color: "#fca5a5" }}>{messagesError}</Typography>
              ) : messages.length === 0 ? (
                <Typography sx={{ color: palette.muted }}>Сообщений пока нет</Typography>
              ) : (
                <>
                  {messages.map((message) => {
                    const isMine = message.senderId === currentUser?.id;

                    return (
                      <Box
                        key={message.id}
                        sx={{
                          alignSelf: isMine ? "flex-end" : "flex-start",
                          maxWidth: "min(480px, 78%)",
                          px: 1.75,
                          py: 1.25,
                          borderRadius: 3,
                          bgcolor: isMine ? "rgba(59,130,246,0.25)" : "rgba(255,255,255,0.07)",
                          border: isMine
                            ? "1px solid rgba(59,130,246,0.28)"
                            : "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <Typography sx={{ color: "#e2e8f0", whiteSpace: "pre-wrap" }}>
                          {message.content}
                        </Typography>
                        <Typography
                          sx={{
                            color: "#94a3b8",
                            fontSize: "0.72rem",
                            mt: 0.75,
                            textAlign: "right",
                          }}
                        >
                          {formatMessageTime(message.createdAt)}
                        </Typography>
                      </Box>
                    );
                  })}
                  <Box ref={messagesEndRef} />
                </>
              )}
            </Box>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

            <Box
              sx={{
                px: 2,
                py: 1.5,
                display: "flex",
                alignItems: "flex-end",
                gap: 1.25,
              }}
            >
              <TextField
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSendMessage();
                  }
                }}
                placeholder="Введите сообщение..."
                fullWidth
                multiline
                maxRows={4}
                InputProps={{
                  sx: {
                    color: "#e2e8f0",
                    bgcolor: "rgba(255,255,255,0.05)",
                    borderRadius: 3,
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={() => void handleSendMessage()}
                disabled={!draft.trim() || sending}
                sx={{
                  minWidth: 52,
                  height: 52,
                  borderRadius: 3,
                  bgcolor: "#2563eb",
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#1d4ed8" },
                }}
              >
                <SendRoundedIcon />
              </Button>
            </Box>
          </>
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

      <Dialog
        open={selectedUserId !== null}
        onClose={() => setSelectedUserId(null)}
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
          {selectedUserId !== null && (
            <UserProfilePage
              onClose={() => setSelectedUserId(null)}
              userId={selectedUserId}
              readOnly
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

async function mapConversation(chat: Chat, me: UserProfile): Promise<ConversationItem | null> {
  const normalizedChatId = getChatId(chat);

  if (!isValidChatId(normalizedChatId)) {
    return null;
  }

  let source = {
    ...chat,
    id: normalizedChatId,
  };

  if (!chat.peerUserId && !chat.participantIds?.length && !chat.participants?.length) {
    try {
      const fullChat = await chatsApi.getById(normalizedChatId);
      source = {
        ...fullChat,
        id: getChatId(fullChat) ?? normalizedChatId,
      };
    } catch {
      source = {
        ...chat,
        id: normalizedChatId,
      };
    }
  }

  const otherUserId =
    source.peerUserId ??
    source.participantIds?.find((participantId) => participantId !== me.id) ??
    source.participants?.find((participant) => participant.userId !== me.id)?.userId;

  if (!otherUserId) {
    if (source.title) {
      return {
        chatId: source.id,
        name: source.title,
        lastMessage: source.lastMessage?.content || "Нет сообщений",
      };
    }

    return null;
  }

  const otherUser = await usersApi.getById(otherUserId);
  const fullName =
    [otherUser.firstName, otherUser.lastName].filter(Boolean).join(" ") || otherUser.username;

  return {
    chatId: source.id,
    userId: otherUser.id,
    name: fullName,
    lastMessage: source.lastMessage?.content || "Нет сообщений",
    avatarUrl: otherUser.avatarUrl,
  };
}

function formatMessageTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isUnauthorizedError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("HTTP 401");
}

function sortMessages(items: Message[]): Message[] {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.createdAt).getTime();
    const rightTime = new Date(right.createdAt).getTime();

    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    return left.id - right.id;
  });
}

function getChatId(chat: Chat): number | null {
  const candidate = chat.chatId ?? chat.id;
  const normalized = typeof candidate === "string" ? Number(candidate) : candidate;
  return isValidChatId(normalized) ? normalized : null;
}

function isValidChatId(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidConversationItem(item: ConversationItem | null): item is ConversationItem {
  return item !== null && isValidChatId(item.chatId);
}
