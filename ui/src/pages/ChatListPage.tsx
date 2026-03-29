import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
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
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { useNavigate } from "react-router-dom";
import {
  chatsApi,
  type ChatDetailsResponse,
  messagesApi,
  usersApi,
  type Chat,
  type ChatType,
  type Message,
  type UserProfile,
} from "../api";
import { clearAuthSession } from "../auth/storage";
import UserProfilePage from "./UserProfilePage";

type ConversationItem = {
  chatId: number;
  chatType?: ChatType;
  userId?: number;
  name: string;
  description?: string;
  lastMessage: string;
  avatarUrl?: string;
};

type SearchMode = "people" | "chats" | null;
type CreateChatMode = "GROUP" | null;

const CHAT_REFRESH_MS = 5000;
const MESSAGE_REFRESH_MS = 3000;
const PEOPLE_SEARCH_MIN_LENGTH = 3;
const PARTICIPANT_SEARCH_MIN_LENGTH = 2;

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
  const [searchMode, setSearchMode] = useState<SearchMode>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [peopleResults, setPeopleResults] = useState<UserProfile[]>([]);
  const [peopleSearchLoading, setPeopleSearchLoading] = useState(false);
  const [peopleSearchError, setPeopleSearchError] = useState<string | null>(null);
  const [startingChatUserId, setStartingChatUserId] = useState<number | null>(null);
  const [deletingChatId, setDeletingChatId] = useState<number | null>(null);
  const [createChatMode, setCreateChatMode] = useState<CreateChatMode>(null);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [participantQuery, setParticipantQuery] = useState("");
  const [participantResults, setParticipantResults] = useState<UserProfile[]>([]);
  const [participantSearchLoading, setParticipantSearchLoading] = useState(false);
  const [participantSearchError, setParticipantSearchError] = useState<string | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<UserProfile[]>([]);
  const [creatingChat, setCreatingChat] = useState(false);
  const [groupProfileOpen, setGroupProfileOpen] = useState(false);
  const [groupProfileLoading, setGroupProfileLoading] = useState(false);
  const [groupProfileError, setGroupProfileError] = useState<string | null>(null);
  const [groupProfile, setGroupProfile] = useState<ChatDetailsResponse | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = useCallback(() => {
    clearAuthSession();
    navigate("/auth", { replace: true });
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

  const handleOpenPrivateChat = useCallback(
    async (user: UserProfile) => {
      if (startingChatUserId === user.id) {
        return;
      }

      try {
        setStartingChatUserId(user.id);
        setPeopleSearchError(null);
        const chat = await chatsApi.create({
          type: "PRIVATE",
          peerUserId: user.id,
        });

        await loadChats(true);
        const nextChatId = getChatId(chat);
        if (isValidChatId(nextChatId)) {
          setSelectedChatId(nextChatId);
        }
        setSelectedUserId(null);
      } catch (createError) {
        setPeopleSearchError(
          createError instanceof Error ? createError.message : "Не удалось открыть личный чат"
        );
      } finally {
        setStartingChatUserId(null);
      }
    },
    [loadChats, startingChatUserId]
  );

  const loadGroupProfile = useCallback(async (chatId: number) => {
    try {
      setGroupProfileLoading(true);
      setGroupProfileError(null);
      const details = await chatsApi.getDetails(chatId);
      setGroupProfile(details);
      setGroupProfileOpen(true);
    } catch (loadError) {
      setGroupProfileError(
        loadError instanceof Error ? loadError.message : "Не удалось загрузить профиль группы"
      );
      setGroupProfileOpen(true);
    } finally {
      setGroupProfileLoading(false);
    }
  }, []);

  const handleDeleteChat = useCallback(
    async (chat: ConversationItem) => {
      if (!chat.userId || deletingChatId === chat.chatId) {
        return;
      }

      const confirmed = window.confirm(`Удалить чат с ${chat.name}?`);
      if (!confirmed) {
        return;
      }

      try {
        setDeletingChatId(chat.chatId);
        await chatsApi.delete(chat.chatId);

        if (selectedChatId === chat.chatId) {
          setMessages([]);
          setMessagesError(null);
        }

        await loadChats(true);
      } catch (deleteError) {
        setChatListError(deleteError instanceof Error ? deleteError.message : "Не удалось удалить чат");
      } finally {
        setDeletingChatId(null);
      }
    },
    [deletingChatId, loadChats, selectedChatId]
  );

  const searchPeople = useCallback(
    async (query: string) => {
      const normalizedQuery = query.trim().toLowerCase();

      if (!normalizedQuery || normalizedQuery.length < PEOPLE_SEARCH_MIN_LENGTH) {
        setPeopleResults([]);
        setPeopleSearchError(null);
        return;
      }

      try {
        setPeopleSearchLoading(true);
        setPeopleSearchError(null);
        const foundUsers = await usersApi.search(normalizedQuery, 20);
        const filteredUsers = foundUsers.filter((user) => {
          const username = user.username.toLowerCase();
          const fullName = [user.firstName, user.lastName]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return username.includes(normalizedQuery) || fullName.includes(normalizedQuery);
        });

        setPeopleResults(
          currentUser
            ? filteredUsers.filter((user) => user.id !== currentUser.id)
            : filteredUsers
        );
      } catch (searchError) {
        setPeopleSearchError(
          searchError instanceof Error ? searchError.message : "Не удалось выполнить поиск людей."
        );
      } finally {
        setPeopleSearchLoading(false);
      }
    },
    [currentUser]
  );

  useEffect(() => {
    if (searchMode !== "people") {
      setPeopleResults([]);
      setPeopleSearchLoading(false);
      setPeopleSearchError(null);
      return;
    }

    const normalizedQuery = searchQuery.trim();
    if (!normalizedQuery || normalizedQuery.length < PEOPLE_SEARCH_MIN_LENGTH) {
      setPeopleResults([]);
      setPeopleSearchLoading(false);
      setPeopleSearchError(null);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void searchPeople(normalizedQuery);
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchMode, searchPeople, searchQuery]);

  const searchParticipants = useCallback(
    async (query: string) => {
      const normalizedQuery = query.trim().toLowerCase();

      if (!normalizedQuery || normalizedQuery.length < PARTICIPANT_SEARCH_MIN_LENGTH) {
        setParticipantResults([]);
        setParticipantSearchError(null);
        return;
      }

      try {
        setParticipantSearchLoading(true);
        setParticipantSearchError(null);
        const foundUsers = await usersApi.search(normalizedQuery, 20);
        const selectedIds = new Set(selectedParticipants.map((participant) => participant.id));

        setParticipantResults(
          foundUsers.filter((user) => {
            if (currentUser && user.id === currentUser.id) {
              return false;
            }

            if (selectedIds.has(user.id)) {
              return false;
            }

            return matchesUserQuery(user, normalizedQuery);
          })
        );
      } catch (searchError) {
        setParticipantSearchError(
          searchError instanceof Error ? searchError.message : "Не удалось найти участников"
        );
      } finally {
        setParticipantSearchLoading(false);
      }
    },
    [currentUser, selectedParticipants]
  );

  useEffect(() => {
    if (!createChatMode) {
      setParticipantResults([]);
      setParticipantSearchLoading(false);
      setParticipantSearchError(null);
      return;
    }

    const normalizedQuery = participantQuery.trim();
    if (!normalizedQuery || normalizedQuery.length < PARTICIPANT_SEARCH_MIN_LENGTH) {
      setParticipantResults([]);
      setParticipantSearchLoading(false);
      setParticipantSearchError(null);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void searchParticipants(normalizedQuery);
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [createChatMode, participantQuery, searchParticipants]);

  const filteredChats = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const haystack = `${conversation.name} ${conversation.description ?? ""} ${conversation.lastMessage}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [conversations, searchQuery]);

  const displayedConversations = useMemo(() => {
    if (searchMode === "chats") {
      return filteredChats;
    }

    return conversations;
  }, [conversations, filteredChats, searchMode]);

  const resetSearch = useCallback(() => {
    setSearchMode(null);
    setSearchQuery("");
    setPeopleResults([]);
    setPeopleSearchError(null);
    setPeopleSearchLoading(false);
  }, []);

  const activateSearch = (mode: Exclude<SearchMode, null>) => {
    setSearchMode((prev) => (prev === mode ? null : mode));
    setSearchQuery("");
    setPeopleResults([]);
    setPeopleSearchError(null);
  };

  const resetCreateChatDialog = () => {
    setCreateChatMode(null);
    setCreateTitle("");
    setCreateDescription("");
    setParticipantQuery("");
    setParticipantResults([]);
    setParticipantSearchLoading(false);
    setParticipantSearchError(null);
    setSelectedParticipants([]);
    setCreatingChat(false);
  };

  const handleCreateChat = async () => {
    if (selectedParticipants.length === 0 || creatingChat) {
      return;
    }

    const generatedTitle = buildGroupTitle(currentUser, selectedParticipants);
    const finalTitle = createTitle.trim() || generatedTitle;

    if (!finalTitle) {
      setParticipantSearchError("Добавьте участников, чтобы собрать название группы");
      return;
    }

    try {
      setCreatingChat(true);
      setParticipantSearchError(null);
      const chat = await chatsApi.create({
        type: "GROUP",
        title: finalTitle,
        description: createDescription.trim() || undefined,
        participantIds: selectedParticipants.map((participant) => participant.id),
      });

      await loadChats(true);
      const nextChatId = getChatId(chat);
      if (isValidChatId(nextChatId)) {
        setSelectedChatId(nextChatId);
      }
      resetCreateChatDialog();
    } catch (createError) {
      setParticipantSearchError(
        createError instanceof Error ? createError.message : "Не удалось создать чат"
      );
      setCreatingChat(false);
    }
  };

  const searchPlaceholder =
    searchMode === "people"
      ? "Поиск людей"
      : searchMode === "chats"
        ? "Поиск чатов"
        : "Поиск";

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

        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: `1px solid ${palette.panelBorder}`,
          }}
        >
          <Stack direction="row" spacing={1.25}>
            <Button
              fullWidth
              variant={searchMode === "people" ? "contained" : "outlined"}
              startIcon={<PersonSearchOutlinedIcon />}
              onClick={() => activateSearch("people")}
              sx={{
                borderColor: "rgba(59,130,246,0.28)",
                color: searchMode === "people" ? "#fff" : "#bfdbfe",
                borderRadius: 3,
                py: 1,
                bgcolor: searchMode === "people" ? "#2563eb" : "transparent",
                boxShadow: "none",
                "&:hover": {
                  borderColor: "rgba(59,130,246,0.55)",
                  bgcolor: searchMode === "people" ? "#1d4ed8" : "rgba(59,130,246,0.08)",
                  boxShadow: "none",
                },
              }}
            >
              Люди
            </Button>
            <Button
              fullWidth
              variant={searchMode === "chats" ? "contained" : "outlined"}
              startIcon={<ForumOutlinedIcon />}
              onClick={() => activateSearch("chats")}
              sx={{
                borderColor: "rgba(255,255,255,0.14)",
                color: "#e2e8f0",
                borderRadius: 3,
                py: 1,
                bgcolor: searchMode === "chats" ? "rgba(255,255,255,0.14)" : "transparent",
                boxShadow: "none",
                "&:hover": {
                  borderColor: "rgba(255,255,255,0.3)",
                  bgcolor: searchMode === "chats" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.04)",
                  boxShadow: "none",
                },
              }}
            >
              Чаты
            </Button>
          </Stack>

          <Button
            fullWidth
            size="small"
            variant="outlined"
            startIcon={<AddCircleOutlineRoundedIcon />}
            onClick={() => setCreateChatMode("GROUP")}
            sx={{
              mt: 1.25,
              borderColor: "rgba(255,255,255,0.14)",
              color: "#e2e8f0",
              borderRadius: 3,
              py: 0.9,
              justifyContent: "flex-start",
            }}
          >
            Создать групповой чат
          </Button>

          {searchMode ? (
            <TextField
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={searchPlaceholder}
              fullWidth
              autoFocus
              sx={{ mt: 1.25 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ color: "#94a3b8" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={resetSearch} sx={{ color: "#94a3b8" }}>
                      <CloseRoundedIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  color: "#e2e8f0",
                  bgcolor: "rgba(255,255,255,0.05)",
                  borderRadius: 3,
                },
              }}
            />
          ) : null}
        </Box>

        <Box sx={{ flex: 1, overflow: "auto", p: 1 }}>
          {loadingChats ? (
            <Typography sx={{ color: palette.muted, p: 2 }}>Загрузка чатов...</Typography>
          ) : chatListError ? (
            <Typography sx={{ color: "#fca5a5", p: 2 }}>{chatListError}</Typography>
          ) : searchMode === "people" ? (
            peopleSearchLoading ? (
              <Typography sx={{ color: palette.muted, p: 2 }}>Ищем людей...</Typography>
            ) : peopleSearchError ? (
              <Typography sx={{ color: "#fca5a5", p: 2 }}>{peopleSearchError}</Typography>
            ) : peopleResults.length > 0 ? (
              <List sx={{ bgcolor: "transparent" }}>
                {peopleResults.map((user) => {
                  const fullName =
                    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username;

                  return (
                    <ListItemButton
                      key={`user-${user.id}`}
                      onClick={() => setSelectedUserId(user.id)}
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        "&:hover": { bgcolor: "rgba(59,130,246,0.15)" },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar src={user.avatarUrl} sx={{ bgcolor: "#3f51b5", mr: 1 }}>
                          {fullName[0]?.toUpperCase() ?? "U"}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography sx={{ color: "#fff", fontWeight: 500 }}>{fullName}</Typography>}
                        secondary={
                          <Typography sx={{ color: palette.muted, fontSize: "0.85rem" }}>
                            @{user.username}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            ) : searchQuery.trim().length >= PEOPLE_SEARCH_MIN_LENGTH ? (
              <Typography sx={{ color: palette.muted, p: 2 }}>Ничего не найдено</Typography>
            ) : (
              <Typography sx={{ color: palette.muted, p: 2 }}>
                Введите минимум {PEOPLE_SEARCH_MIN_LENGTH} символа для поиска по нику
              </Typography>
            )
          ) : (
            <>
              <List sx={{ bgcolor: "transparent" }}>
                {displayedConversations.map((chat) => (
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
                      <Avatar
                        src={chat.avatarUrl}
                        sx={{ bgcolor: chat.chatType === "PRIVATE" ? "#3f51b5" : "#0f766e", mr: 1 }}
                      >
                        {chat.name[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography sx={{ color: "#fff", fontWeight: 500 }}>{chat.name}</Typography>
                          {chat.chatType === "GROUP" ? (
                            <Chip
                              label="Группа"
                              size="small"
                              sx={{
                                height: 20,
                                bgcolor: "rgba(20,184,166,0.16)",
                                color: "#99f6e4",
                                border: "1px solid rgba(20,184,166,0.28)",
                              }}
                            />
                          ) : null}
                        </Stack>
                      }
                      secondary={
                        <Typography sx={{ color: palette.muted, fontSize: "0.85rem" }}>
                          {chat.lastMessage}
                        </Typography>
                      }
                    />
                    {chat.userId ? (
                      <Tooltip title="Удалить чат">
                        <span>
                          <IconButton
                            edge="end"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleDeleteChat(chat);
                            }}
                            disabled={deletingChatId === chat.chatId}
                            sx={{
                              color: "#fda4af",
                              ml: 1,
                              "&:hover": { bgcolor: "rgba(244,63,94,0.1)" },
                            }}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    ) : null}
                  </ListItemButton>
                ))}
              </List>

              {searchMode === "chats" && displayedConversations.length === 0 ? (
                <Typography sx={{ color: palette.muted, p: 2 }}>
                  {searchQuery.trim() ? "Чаты не найдены" : "Начните вводить название чата"}
                </Typography>
              ) : null}
            </>
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
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              px: 3,
              textAlign: "center",
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
                justifyContent: "space-between",
                gap: 1.5,
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                <Avatar
                  src={selectedConversation.avatarUrl}
                  onClick={() => {
                    if (selectedConversation.userId) {
                      setSelectedUserId(selectedConversation.userId);
                      return;
                    }

                    if (selectedConversation.chatType === "GROUP") {
                      void loadGroupProfile(selectedConversation.chatId);
                    }
                  }}
                  sx={{
                    width: 44,
                    height: 44,
                    cursor:
                      selectedConversation.userId || selectedConversation.chatType === "GROUP"
                        ? "pointer"
                        : "default",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    "&:hover": selectedConversation.userId || selectedConversation.chatType === "GROUP"
                      ? {
                          transform: "scale(1.04)",
                          boxShadow: "0 0 0 3px rgba(59,130,246,0.18)",
                        }
                      : undefined,
                  }}
                >
                  {selectedConversation.name[0]}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: "#fff", fontWeight: 700 }}>
                    {selectedConversation.name}
                  </Typography>
                  <Typography sx={{ color: palette.muted, fontSize: "0.85rem" }}>
                    {getConversationSubtitle(selectedConversation)}
                  </Typography>
                  <Typography sx={{ color: palette.muted, fontSize: "0.85rem", display: "none" }}>
                    Личная переписка
                  </Typography>
                </Box>
              </Stack>
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
          {selectedUserId !== null ? (
            <UserProfilePage
              onClose={() => setSelectedUserId(null)}
              userId={selectedUserId}
              readOnly
              actionLabel="Написать"
              actionLoading={startingChatUserId === selectedUserId}
              onAction={(user) => handleOpenPrivateChat(user)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={createChatMode !== null}
        onClose={resetCreateChatDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: "#0f172a",
            color: "#fff",
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.08)",
          },
        }}
      >
        <DialogTitle>Создать групповой чат</DialogTitle>
        <DialogContent sx={{ pt: "8px !important" }}>
          <Stack spacing={2}>
            <TextField
              label="Название группового чата"
              value={createTitle}
              onChange={(event) => setCreateTitle(event.target.value)}
              fullWidth
              helperText={
                selectedParticipants.length > 0
                  ? `Если оставить пустым, будет: ${buildGroupTitle(currentUser, selectedParticipants)}`
                  : "Можно ввести свое название или собрать его автоматически из ников"
              }
              InputProps={{
                sx: {
                  color: "#e2e8f0",
                  bgcolor: "rgba(255,255,255,0.05)",
                  borderRadius: 3,
                },
              }}
            />
            <TextField
              label="Описание"
              value={createDescription}
              onChange={(event) => setCreateDescription(event.target.value)}
              fullWidth
              multiline
              minRows={2}
              InputProps={{
                sx: {
                  color: "#e2e8f0",
                  bgcolor: "rgba(255,255,255,0.05)",
                  borderRadius: 3,
                },
              }}
            />
            <TextField
              label="Добавить участников"
              value={participantQuery}
              onChange={(event) => setParticipantQuery(event.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AddCircleOutlineRoundedIcon sx={{ color: "#94a3b8" }} />
                  </InputAdornment>
                ),
                sx: {
                  color: "#e2e8f0",
                  bgcolor: "rgba(255,255,255,0.05)",
                  borderRadius: 3,
                },
              }}
            />

            {selectedParticipants.length > 0 ? (
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {selectedParticipants.map((participant) => (
                  <Chip
                    key={`participant-chip-${participant.id}`}
                    label={`@${participant.username}`}
                    onDelete={() =>
                      setSelectedParticipants((prev) =>
                        prev.filter((item) => item.id !== participant.id)
                      )
                    }
                    sx={{
                      bgcolor: "rgba(59,130,246,0.12)",
                      color: "#bfdbfe",
                      border: "1px solid rgba(59,130,246,0.28)",
                    }}
                  />
                ))}
              </Stack>
            ) : null}

            {participantSearchError ? (
              <Typography sx={{ color: "#fca5a5", fontSize: "0.9rem" }}>
                {participantSearchError}
              </Typography>
            ) : null}

            {participantSearchLoading ? (
              <Typography sx={{ color: palette.muted }}>Ищем пользователей...</Typography>
            ) : participantResults.length > 0 ? (
              <List sx={{ maxHeight: 220, overflow: "auto", p: 0 }}>
                {participantResults.map((user) => {
                  const fullName =
                    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username;

                  return (
                    <ListItemButton
                      key={`create-chat-user-${user.id}`}
                      onClick={() => {
                        setSelectedParticipants((prev) => [...prev, user]);
                        setParticipantQuery("");
                        setParticipantResults([]);
                      }}
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        "&:hover": { bgcolor: "rgba(59,130,246,0.15)" },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar src={user.avatarUrl}>{fullName[0]?.toUpperCase() ?? "U"}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography sx={{ color: "#fff" }}>{fullName}</Typography>}
                        secondary={
                          <Typography sx={{ color: palette.muted, fontSize: "0.85rem" }}>
                            @{user.username}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            ) : (
              <Typography sx={{ color: palette.muted }}>
                Добавьте одного или нескольких участников в групповой чат.
              </Typography>
            )}

            <Stack direction="row" spacing={1.25} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={resetCreateChatDialog}
                disabled={creatingChat}
                sx={{ borderColor: "rgba(255,255,255,0.18)", color: "#e2e8f0" }}
              >
                Отмена
              </Button>
              <Button
                variant="contained"
                onClick={() => void handleCreateChat()}
                disabled={selectedParticipants.length === 0 || creatingChat}
                sx={{ bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}
              >
                {creatingChat ? "Создаем..." : "Создать группу"}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog
        open={groupProfileOpen}
        onClose={() => {
          setGroupProfileOpen(false);
          setGroupProfile(null);
          setGroupProfileError(null);
        }}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: "#0f172a",
            color: "#fff",
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.08)",
          },
        }}
      >
        <DialogTitle>Профиль группы</DialogTitle>
        <DialogContent sx={{ pt: "8px !important" }}>
          {groupProfileLoading ? (
            <Typography sx={{ color: palette.muted }}>Загрузка группы...</Typography>
          ) : groupProfileError ? (
            <Typography sx={{ color: "#fca5a5" }}>{groupProfileError}</Typography>
          ) : groupProfile ? (
            <Stack spacing={2}>
              <Box>
                <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>
                  {groupProfile.chat.title || "Групповой чат"}
                </Typography>
                <Typography sx={{ color: palette.muted, mt: 0.5 }}>
                  {groupProfile.chat.description || "Описание пока не добавлено"}
                </Typography>
              </Box>

              <Box>
                <Typography sx={{ color: "#fff", fontWeight: 600, mb: 1 }}>
                  Участники ({groupProfile.participants.length})
                </Typography>
                <List sx={{ p: 0 }}>
                  {groupProfile.participants.map((participant) => (
                    <ListItemButton
                      key={`group-member-${participant.userId}`}
                      onClick={() => setSelectedUserId(participant.userId)}
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        "&:hover": { bgcolor: "rgba(59,130,246,0.15)" },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar>{participant.username?.[0]?.toUpperCase() ?? "U"}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography sx={{ color: "#fff" }}>{participant.username}</Typography>}
                        secondary={
                          <Typography sx={{ color: palette.muted, fontSize: "0.85rem" }}>
                            {participant.role || "MEMBER"}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Box>
            </Stack>
          ) : null}
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
      const fullChat = await chatsApi.getDetails(normalizedChatId);
      source = {
        ...fullChat.chat,
        participants: fullChat.participants,
        participantIds: fullChat.participants.map((participant) => participant.userId),
        id: getChatId(fullChat.chat) ?? normalizedChatId,
      };
    } catch {
      source = {
        ...chat,
        id: normalizedChatId,
      };
    }
  }

  if (source.type !== "PRIVATE") {
    return {
      chatId: source.id,
      chatType: source.type,
      name: source.title || buildGroupTitle(me, []),
      description: source.description,
      lastMessage: source.lastMessage?.content || "Нет сообщений",
      avatarUrl: source.avatarUrl,
    };
  }

  const otherUserId =
    source.peerUserId ??
    source.participantIds?.find((participantId) => participantId !== me.id) ??
    source.participants?.find((participant) => participant.userId !== me.id)?.userId;

  if (!otherUserId) {
    if (source.title) {
      return {
        chatId: source.id,
        chatType: source.type,
        name: source.title,
        description: source.description,
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
    chatType: source.type,
    userId: otherUser.id,
    name: fullName,
    description: otherUser.bio,
    lastMessage: source.lastMessage?.content || "Нет сообщений",
    avatarUrl: otherUser.avatarUrl,
  };
}

function matchesUserQuery(user: UserProfile, query: string): boolean {
  const normalizedQuery = query.toLowerCase();
  const username = user.username.toLowerCase();
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").toLowerCase();

  return username.includes(normalizedQuery) || fullName.includes(normalizedQuery);
}

function buildGroupTitle(currentUser: UserProfile | null, participants: UserProfile[]): string {
  return [currentUser?.username, ...participants.map((participant) => participant.username)]
    .filter(Boolean)
    .join(", ");
}

function getConversationSubtitle(conversation: ConversationItem): string {
  if (conversation.chatType === "GROUP") {
    return "Групповой чат";
  }

  return "Личная переписка";
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
