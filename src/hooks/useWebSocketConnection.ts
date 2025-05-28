import { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useTranslation } from "react-i18next";

export interface Message {
  id: string;
  text: string;
  type: "text" | "photo" | "file";
  fileId?: string;
  timestamp: number;
  isRead: boolean;
  fromUser: boolean;
  isWelcome?: boolean; // теперь опционально
}

export interface FormState {
  name: string;
  topic: string;
}

export interface FileData {
  id: string;
  name: string;
  type: "photo" | "file";
  url: string;
  preview?: string;
}

export const useWebSocketConnection = () => {
  const { t, i18n } = useTranslation();

  // Инициализация userId при первом входе на сайт
  const [currentUserId] = useState<string>(() => {
    const saved = localStorage.getItem("chat_user_id");
    if (saved) return saved;
    const newId = uuidv4();
    localStorage.setItem("chat_user_id", newId);
    // Отмечаем как нового пользователя только если это первый вход
    const isFirstVisit = !localStorage.getItem("chat_first_visit_done");
    if (isFirstVisit) {
      localStorage.setItem("chat_is_new_user", "true");
      localStorage.setItem("chat_first_visit_done", "true");
    }
    return newId;
  });

  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasWelcomeMessage, setHasWelcomeMessage] = useState(false);
  const [hasLeftSite, setHasLeftSite] = useState(false);

  const [form, setForm] = useState<FormState>(() => {
    try {
      const saved = localStorage.getItem(`chat_${currentUserId}_form`);
      if (saved) return JSON.parse(saved) as FormState;
    } catch {}
    return { name: "", topic: "" };
  });

  const [tempFiles, setTempFiles] = useState<FileData[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const userIdRef = useRef<string>(currentUserId);
  const serverOrigin = window.location.origin;

  // Проверка перезапуска сервера
  useEffect(() => {
    fetch("/server-start")
      .then((res) => res.json())
      .then((data: { serverStart: number }) => {
        const newStamp = data.serverStart.toString();
        localStorage.setItem("chat_serverStart", newStamp);
      })
      .catch(() => {
        // Игнорируем ошибки
      });
  }, []);

  // Загрузка сохранённых сообщений
  useEffect(() => {
    const savedMessages = localStorage.getItem(
      `chat_${currentUserId}_messages`,
    );
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed);
        // Проверяем есть ли приветственное сообщение
        const hasWelcome = parsed.some(
          (msg: Message) => !msg.fromUser && msg.text.includes(t('chat.welcome_message')),
        );
        setHasWelcomeMessage(hasWelcome);
      } catch {
        setMessages([]);
      }
    }
  }, [currentUserId]);

  // Сохранение данных
  useEffect(() => {
    const saveData = () => {
      try {
        localStorage.setItem(
          `chat_${currentUserId}_form`,
          JSON.stringify(form),
        );
      } catch (e) {
        console.warn("Не удалось записать form в localStorage:", e);
      }

      const MAX_CACHE = 100;
      if (messages.length > MAX_CACHE) {
        const tail = messages.slice(messages.length - MAX_CACHE);
        try {
          localStorage.setItem(
            `chat_${currentUserId}_messages`,
            JSON.stringify(tail),
          );
        } catch (e) {
          console.warn("Не удалось записать messages в localStorage:", e);
        }
      } else {
        try {
          localStorage.setItem(
            `chat_${currentUserId}_messages`,
            JSON.stringify(messages),
          );
        } catch (e) {
          console.warn("Не удалось записать messages в localStorage:", e);
        }
      }
    };

    window.addEventListener("beforeunload", saveData);
    try {
      localStorage.setItem(`chat_${currentUserId}_form`, JSON.stringify(form));
    } catch {}

    return () => {
      saveData();
      window.removeEventListener("beforeunload", saveData);
    };
  }, [messages, form, currentUserId]);

  // WebSocket подключение
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // Правильное формирование URL для разных окружений
    let wsUrl: string;
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      // Локальная разработка
      wsUrl = `ws://localhost:3001/ws?userId=${userIdRef.current}`;
    } else {
      // Продакшн или Cloudflare tunnel
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      wsUrl = `${protocol}//${host}/ws?userId=${userIdRef.current}`;
    }

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "file_ack" && data.success) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === data.fileId ? { ...m, isRead: true } : m,
              ),
            );
            return;
          }

          if (data.type === "form_ack") {
            return;
          }

          if (data.type === "init") {
            setMessages((prevLocal) => {
              const serverHistory: Message[] = data.history;
              const serverMap = new Map<string, Message>();
              serverHistory.forEach((m) => serverMap.set(m.id, m));
              const uniqueLocal = prevLocal.filter((m) => !serverMap.has(m.id));
              const combined = [...uniqueLocal, ...serverHistory];

              // Проверяем есть ли приветственное сообщение
              const hasWelcome = combined.some(
                (msg) => !msg.fromUser && msg.text.includes(t('chat.welcome_message')),
              );
              setHasWelcomeMessage(hasWelcome);

              return combined;
            });

            // Устанавливаем количество непрочитанных сообщений
            if (data.unreadCount && data.unreadCount > 0) {
              setUnreadCount(data.unreadCount);
            } else if (data.pending && data.pending.length > 0) {
              setUnreadCount(data.pending.length);
            }
            return;
          }

          if (data.action === "admin_message") {
            const newMsg: Message = {
              id: data.id || uuidv4(),
              text: data.text,
              type: data.contentType,
              fileId: data.fileId,
              timestamp: data.timestamp || Date.now(),
              isRead: false, // Всегда false для фоновых уведомлений
              fromUser: false,
            };
            setMessages((prev) => {
              // Не добавляем, если уже есть сообщение с таким id
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });

            // Увеличиваем счетчик непрочитанных
            setUnreadCount((c) => c + 1);
          }

          if (data.action === "welcome_message") {
            const welcomeMsg: Message = {
              id: data.id || uuidv4(),
              text: t('chat.welcome_message'),
              type: "text",
              timestamp: data.timestamp || Date.now(),
              isRead: false,
              fromUser: false,
              isWelcome: true, // <--- добавляем флаг
            };
            setMessages((prev) => {
              if (prev.some((m) => m.id === welcomeMsg.id)) return prev;
              return [...prev, welcomeMsg];
            });
            setHasWelcomeMessage(true);
            setUnreadCount((c) => c + 1);
          }

          if (data.action === "continue_discussion") {
            const continueMsg: Message = {
              id: data.id || uuidv4(),
              text: data.text,
              type: "text",
              timestamp: data.timestamp || Date.now(),
              isRead: false,
              fromUser: false,
            };
            setMessages((prev) => {
              if (prev.some((m) => m.id === continueMsg.id)) return prev;
              return [...prev, continueMsg];
            });
            // Увеличиваем счетчик непрочитанных
            setUnreadCount((c) => c + 1);
          }
        } catch (e) {
          console.error("Ошибка при разборе сообщения WS:", e);
        }
      };

      ws.onclose = (event) => {
        console.log(
          `WebSocket закрыт: код=${event.code}, причина='${event.reason}'`,
        );
        setIsConnected(false);
        wsRef.current = null;

        // Переподключаемся только если это не намеренное закрытие
        if (event.code !== 1000 && event.code !== 1001) {
          console.log("Попытка переподключения через 3 секунды...");
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connectWebSocket();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket ошибка:", error);
        setIsConnected(false);

        // Переподключаемся при ошибке
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connectWebSocket();
          }, 3000);
        }
      };

      return ws;
    } catch (error) {
      console.error("Ошибка при создании WebSocket:", error);
      return null;
    }
  }, []);

  // Отслеживание реального покидания сайта
  useEffect(() => {
    const handleBeforeUnload = () => {
      setHasLeftSite(true);
      localStorage.setItem("chat_user_left_site", "true");
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "user_leaving_site" }));
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Пользователь переключился на другую вкладку или свернул браузер
        setTimeout(() => {
          if (document.hidden) {
            setHasLeftSite(true);
            localStorage.setItem("chat_user_left_site", "true");
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: "user_leaving_site" }));
            }
          }
        }, 5000); // 5 секунд как запрошено
      } else {
        // Пользователь вернулся на вкладку
        const hadLeftSite =
          localStorage.getItem("chat_user_left_site") === "true";
        if (hadLeftSite) {
          localStorage.removeItem("chat_user_left_site");
          setHasLeftSite(false);
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({ type: "user_returned_to_site" }),
            );
          }
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Подключение WebSocket при загрузке страницы с debounce
  useEffect(() => {
    // Предотвращаем множественные подключения
    if (
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    // Проверяем, возвращается ли пользователь после покидания сайта
    const hadLeftSite = localStorage.getItem("chat_user_left_site") === "true";
    if (hadLeftSite) {
      localStorage.removeItem("chat_user_left_site");
      setHasLeftSite(false);

      // Отправляем событие возврата на сайт после подключения
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "user_returned_to_site" }));
        }
      }, 500);
    }

    // Небольшая задержка для предотвращения множественных подключений
    const connectTimeout = setTimeout(() => {
      connectWebSocket();
    }, 100);

    return () => {
      clearTimeout(connectTimeout);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  // Функции для отправки сообщений
  const sendMessage = useCallback((text: string) => {
    if (
      !text.trim() ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN
    ) {
      return false;
    }

    const message: Message = {
      id: uuidv4(),
      text: text.trim(),
      type: "text",
      timestamp: Date.now(),
      isRead: false,
      fromUser: true,
    };

    setMessages((prev) => [...prev, message]);

    wsRef.current.send(
      JSON.stringify({
        type: "message",
        text: message.text,
        timestamp: message.timestamp,
        id: message.id,
      }),
    );

    return true;
  }, []);

  const sendForm = useCallback((formData: FormState) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }

    const formId = uuidv4();
    wsRef.current.send(
      JSON.stringify({
        type: "form",
        formId,
        ...formData,
      }),
    );

    setForm(formData);
    return true;
  }, []);

  const sendFile = useCallback((file: File) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }

    const fileId = uuidv4();
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;
      const fileData: FileData = {
        id: fileId,
        name: file.name,
        type: file.type.startsWith("image/") ? "photo" : "file",
        url: dataUrl,
        preview: dataUrl,
      };

      setTempFiles((prev) => [...prev, fileData]);

      const localMsg: Message = {
        id: fileId,
        text: file.name,
        type: fileData.type,
        fileId,
        timestamp: Date.now(),
        isRead: false,
        fromUser: true,
      };

      setMessages((prev) => [...prev, localMsg]);

      wsRef.current?.send(
        JSON.stringify({
          type: "file",
          fileId,
          fileName: file.name,
          fileType: file.type,
          data: dataUrl.split(",")[1],
        }),
      );
    };

    reader.readAsDataURL(file);
    return true;
  }, []);

  const markAsRead = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: "read", userId: userIdRef.current }),
      );
    }

    setUnreadCount(0);
    setMessages((prev) => prev.map((msg) => ({ ...msg, isRead: true })));
  }, []);

  const updateTopic = useCallback((topic: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "update_topic", topic }));
    }
    setForm((prev) => ({ ...prev, topic }));
  }, []);

  // Автоматический перевод приветственного сообщения при смене языка
  useEffect(() => {
    const handleLangChange = () => {
      setMessages((prev) => {
        // ищем последнее приветственное сообщение (isWelcome)
        return prev.map((msg) => {
          if (msg.isWelcome) {
            return { ...msg, text: i18n.getFixedT(i18n.language)('chat.welcome_message') };
          }
          return msg;
        });
      });
    };
    i18n.on('languageChanged', handleLangChange);
    return () => {
      i18n.off('languageChanged', handleLangChange);
    };
  }, [i18n, t]);

  return {
    currentUserId,
    isConnected,
    messages,
    unreadCount,
    hasWelcomeMessage,
    form,
    tempFiles,
    serverOrigin,
    sendMessage,
    sendForm,
    sendFile,
    markAsRead,
    updateTopic,
    setForm,
  };
};
