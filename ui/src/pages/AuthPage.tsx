import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Paper, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import type { CreateUserRequest, LoginRequest } from "../api";
import { authApi, usersApi } from "../api";
import { getAuthToken, setAuthSession, setStoredUser } from "../auth/storage";

type AuthMode = "login" | "register";

const palette = {
  bg: "#09111f",
  panel: "rgba(10, 22, 40, 0.92)",
  panelAlt: "rgba(11, 27, 56, 0.92)",
  border: "rgba(148, 163, 184, 0.18)",
  accent: "#3b82f6",
  accentSoft: "rgba(59, 130, 246, 0.16)",
  text: "#e2e8f0",
  muted: "#94a3b8",
};

const initialLogin: LoginRequest = {
  emailOrUsername: "",
  password: "",
};

const initialRegister: CreateUserRequest = {
  username: "",
  email: "",
  firstName: "",
  lastName: "",
  password: "",
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === "Failed to fetch") {
      return "Не удалось подключиться к API. Проверьте адрес сервера, CORS и доступность бэкенда.";
    }

    return error.message;
  }

  return "Не удалось выполнить запрос";
}

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loginForm, setLoginForm] = useState<LoginRequest>(initialLogin);
  const [registerForm, setRegisterForm] = useState<CreateUserRequest>(initialRegister);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getAuthToken()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const title = useMemo(
    () =>
      mode === "login"
        ? "Войдите в аккаунт"
        : "Создайте профиль и продолжайте в чатах",
    [mode]
  );

  const handleLoginChange = (field: keyof LoginRequest, value: string) => {
    setLoginForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegisterChange = (field: keyof CreateUserRequest, value: string) => {
    setRegisterForm((prev) => ({ ...prev, [field]: value }));
  };

  const completeAuth = async (
    payload: Awaited<ReturnType<typeof authApi.login>>,
    profilePatch?: Pick<CreateUserRequest, "firstName" | "lastName">
  ) => {
    setAuthSession(payload.token, payload.refreshToken, payload.user);

    try {
      await usersApi.updateMe({
        status: "ONLINE",
        firstName: profilePatch?.firstName?.trim() || undefined,
        lastName: profilePatch?.lastName?.trim() || undefined,
      });

      const me = await usersApi.getMe();
      setStoredUser(me);
    } catch {
      if (payload.user) {
        setStoredUser(payload.user);
      }
    }

    navigate("/", { replace: true });
  };

  const submitLogin = async () => {
    if (!loginForm.emailOrUsername.trim() || !loginForm.password.trim()) {
      setError('Заполните поля "Email или username" и "Пароль"');
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await authApi.login(loginForm);
      await completeAuth(response);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async () => {
    if (
      !registerForm.username.trim() ||
      !registerForm.email.trim() ||
      !registerForm.password.trim()
    ) {
      setError("Для регистрации нужны username, email и пароль");
      return;
    }

    if (registerForm.password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await authApi.register(registerForm);
      const response = await authApi.login({
        emailOrUsername: registerForm.username,
        password: registerForm.password,
      });
      await completeAuth(response, {
        firstName: registerForm.firstName,
        lastName: registerForm.lastName,
      });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
        bgcolor: palette.bg,
        background:
          "radial-gradient(circle at top left, rgba(59,130,246,0.24), transparent 32%), radial-gradient(circle at bottom right, rgba(14,165,233,0.14), transparent 28%), linear-gradient(135deg, #09111f 0%, #0a1628 45%, #0d1f3a 100%)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          px: { xs: 3, md: 8 },
          py: { xs: 5, md: 8 },
          color: palette.text,
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: "0.9rem", md: "1rem" },
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "#60a5fa",
            mb: 2,
          }}
        >
          Messenger
        </Typography>
        <Typography
          variant="h2"
          sx={{
            color: palette.text,
            fontWeight: 800,
            lineHeight: 1.05,
            mb: 2,
            fontSize: { xs: "2.4rem", md: "4rem" },
          }}
        >
          Общение начинается с одного безопасного входа.
        </Typography>
        <Typography
          sx={{
            maxWidth: 560,
            color: palette.muted,
            fontSize: { xs: "1rem", md: "1.1rem" },
            lineHeight: 1.7,
          }}
        >
          После входа токен сохраняется локально, а следующие запросы автоматически идут с
          `Bearer`-авторизацией через общий API-клиент.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 3,
          py: { xs: 2, md: 4 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "min(100%, 480px)",
            p: { xs: 3, md: 4 },
            borderRadius: 5,
            border: `1px solid ${palette.border}`,
            bgcolor: palette.panel,
            backdropFilter: "blur(18px)",
            boxShadow: "0 24px 80px rgba(2, 8, 23, 0.45)",
          }}
        >
          <Tabs
            value={mode}
            onChange={(_, value: AuthMode) => {
              setMode(value);
              setError("");
              setSuccess("");
            }}
            sx={{
              mb: 3,
              backgroundColor: palette.panelAlt,
              borderRadius: 999,
              minHeight: 52,
              p: 0.5,
              "& .MuiTabs-indicator": { display: "none" },
            }}
          >
            <Tab
              value="login"
              label="Вход"
              sx={{
                flex: 1,
                minHeight: 44,
                borderRadius: 999,
                color: palette.muted,
                "&.Mui-selected": {
                  color: palette.text,
                  bgcolor: palette.accentSoft,
                },
              }}
            />
            <Tab
              value="register"
              label="Регистрация"
              sx={{
                flex: 1,
                minHeight: 44,
                borderRadius: 999,
                color: palette.muted,
                "&.Mui-selected": {
                  color: palette.text,
                  bgcolor: palette.accentSoft,
                },
              }}
            />
          </Tabs>

          <Stack spacing={2.2}>
            <Box>
              <Typography variant="h5" sx={{ color: palette.text, fontWeight: 700, mb: 1 }}>
                {title}
              </Typography>
              <Typography sx={{ color: palette.muted, lineHeight: 1.6 }}>
                {mode === "login"
                  ? "Используйте email или username для входа."
                  : "После регистрации мы сразу входим в аккаунт и загружаем профиль."}
              </Typography>
            </Box>

            {error && (
              <Alert
                severity="error"
                sx={{
                  bgcolor: "rgba(239,68,68,0.12)",
                  color: "#fecaca",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                {error}
              </Alert>
            )}

            {success && (
              <Alert
                severity="success"
                sx={{
                  bgcolor: "rgba(34,197,94,0.12)",
                  color: "#bbf7d0",
                  border: "1px solid rgba(34,197,94,0.2)",
                }}
              >
                {success}
              </Alert>
            )}

            {mode === "login" ? (
              <>
                <TextField
                  label="Email или username"
                  value={loginForm.emailOrUsername}
                  onChange={(event) => handleLoginChange("emailOrUsername", event.target.value)}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={fieldStyles}
                />
                <TextField
                  label="Пароль"
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => handleLoginChange("password", event.target.value)}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={fieldStyles}
                />
                <Button
                  variant="contained"
                  onClick={submitLogin}
                  disabled={loading}
                  sx={submitButtonStyles}
                >
                  {loading ? "Входим..." : "Войти"}
                </Button>
              </>
            ) : (
              <>
                <TextField
                  label="Username"
                  value={registerForm.username}
                  onChange={(event) => handleRegisterChange("username", event.target.value)}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={fieldStyles}
                />
                <TextField
                  label="Email"
                  type="email"
                  value={registerForm.email}
                  onChange={(event) => handleRegisterChange("email", event.target.value)}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={fieldStyles}
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="Имя"
                    value={registerForm.firstName}
                    onChange={(event) => handleRegisterChange("firstName", event.target.value)}
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={fieldStyles}
                  />
                  <TextField
                    label="Фамилия"
                    value={registerForm.lastName}
                    onChange={(event) => handleRegisterChange("lastName", event.target.value)}
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={fieldStyles}
                  />
                </Stack>
                <TextField
                  label="Пароль"
                  type="password"
                  value={registerForm.password}
                  onChange={(event) => handleRegisterChange("password", event.target.value)}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={fieldStyles}
                />
                <TextField
                  label="Повторите пароль"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={fieldStyles}
                />
                <Button
                  variant="contained"
                  onClick={submitRegister}
                  disabled={loading}
                  sx={submitButtonStyles}
                >
                  {loading ? "Создаем аккаунт..." : "Зарегистрироваться"}
                </Button>
              </>
            )}
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}

const fieldStyles = {
  "& .MuiOutlinedInput-root": {
    color: palette.text,
    borderRadius: 3,
    backgroundColor: palette.panelAlt,
    "& fieldset": {
      borderColor: palette.border,
    },
    "&:hover fieldset": {
      borderColor: "rgba(96,165,250,0.55)",
    },
    "&.Mui-focused fieldset": {
      borderColor: palette.accent,
    },
  },
  "& .MuiInputLabel-root": {
    color: palette.muted,
  },
};

const submitButtonStyles = {
  mt: 1,
  minHeight: 52,
  borderRadius: 3,
  bgcolor: palette.accent,
  textTransform: "none",
  fontSize: "1rem",
  fontWeight: 700,
  boxShadow: "0 18px 36px rgba(37, 99, 235, 0.28)",
  "&:hover": {
    bgcolor: "#2563eb",
  },
  "&.Mui-disabled": {
    bgcolor: "rgba(59,130,246,0.4)",
    color: "rgba(255,255,255,0.72)",
  },
};
