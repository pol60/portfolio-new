import React, { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import "./Chat.css";

interface FileData {
  id: string;
  name: string;
  type: 'photo' | 'file';
  url: string;
  preview?: string;
}

interface Message {
  id: string;
  text: string;
  type: 'text' | 'photo' | 'file';
  fileId?: string;
  timestamp: number;
  isRead: boolean;
  fromUser: boolean;
}

interface FormState {
  name: string;
  topic: string;
}

interface ChatProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Chat: React.FC<ChatProps> = ({ isOpen: externalIsOpen, onClose }) => {
  // 1. Проверка перезапуска сервера (только сохраняем метку, без очистки localStorage)
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

  // 2. Инициализация currentUserId
  const [currentUserId] = useState<string>(() => {
    const saved = localStorage.getItem("chat_user_id");
    if (saved) return saved;
    const newId = uuidv4();
    localStorage.setItem("chat_user_id", newId);
    return newId;
  });
  const userIdRef = useRef<string>(currentUserId);

  // 3. Состояния чата
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [form, setForm] = useState<FormState>(() => {
    try {
      const saved = localStorage.getItem(`chat_${currentUserId}_form`);
      if (saved) return JSON.parse(saved) as FormState;
    } catch {}
    return { name: "", topic: "" };
  });
  const [showForm, setShowForm] = useState<boolean>(() => {
    return !(Boolean(form.name) && Boolean(form.topic));
  });

  const [tempFiles, setTempFiles] = useState<FileData[]>([]);
  const [showFilePreview, setShowFilePreview] = useState<FileData | null>(null);
  const [showTopicForm, setShowTopicForm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // 4. Появление кнопки после скролла ниже 80px с анимацией снизу слева направо
  const [showButton, setShowButton] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 5. Анимация иконок внутри круглой кнопки с плавным превращением
  const icons = [
    { class: "fas fa-hands-helping" },
    { class: "fas fa-lightbulb" },
    { class: "fas fa-comments" }
  ];
  const [iconIndex, setIconIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setIconIndex((idx) => (idx + 1) % icons.length);
        setIsTransitioning(false);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const serverOrigin = window.location.origin;

  // 6. Загрузка сохранённых сообщений
  useEffect(() => {
    const savedMessages = localStorage.getItem(`chat_${currentUserId}_messages`);
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch {
        setMessages([]);
      }
    }
  }, [currentUserId]);

  // 7. Сохранение form и последних 100 сообщений
  useEffect(() => {
    const saveData = () => {
      try {
        localStorage.setItem(`chat_${currentUserId}_form`, JSON.stringify(form));
      } catch (e) {
        console.warn("Не удалось записать form в localStorage:", e);
      }

      const MAX_CACHE = 100;
      if (messages.length > MAX_CACHE) {
        const tail = messages.slice(messages.length - MAX_CACHE);
        try {
          localStorage.setItem(
            `chat_${currentUserId}_messages`,
            JSON.stringify(tail)
          );
        } catch (e) {
          console.warn("Не удалось записать messages в localStorage:", e);
        }
      } else {
        try {
          localStorage.setItem(
            `chat_${currentUserId}_messages`,
            JSON.stringify(messages)
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

  // 8. Отправка формы (имя + тема)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const sendFormData = () => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) {
        console.error("Соединение не установлено");
        return;
      }
      const formId = uuidv4();
      const ackHandler = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "form_ack" && data.formId === formId) {
            setShowForm(false);
            wsRef.current?.removeEventListener("message", ackHandler);
          }
        } catch {}
      };

      wsRef.current?.addEventListener("message", ackHandler);
      wsRef.current?.send(
        JSON.stringify({
          type: "form",
          formId,
          ...form,
        })
      );
    };

    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      wsRef.current.addEventListener("open", sendFormData);
    } else if (wsRef.current?.readyState === WebSocket.OPEN) {
      sendFormData();
    } else {
      console.error("WebSocket не подключен");
      connectWebSocket();
      setTimeout(() => handleSubmitForm(e), 500);
    }
  };

  // 9. Загрузка файла (фото/документ)
  const handleFileUpload = async (file: File) => {
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
        })
      );
    };
    reader.readAsDataURL(file);
  };

  // 10. WebSocket
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws?userId=${userIdRef.current}`;

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
                m.id === data.fileId ? { ...m, isRead: true } : m
              )
            );
            return;
          }

          if (data.type === "form_ack") {
            setShowForm(false);
            return;
          }

          if (data.type === "init") {
            setMessages((prevLocal) => {
              const serverHistory: Message[] = data.history;
              const serverMap = new Map<string, Message>();
              serverHistory.forEach((m) => serverMap.set(m.id, m));
              const uniqueLocal = prevLocal.filter(
                (m) => !serverMap.has(m.id)
              );
              return [...uniqueLocal, ...serverHistory];
            });
            if (data.pending && data.pending.length > 0) {
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
              isRead: data.isRead || false,
              fromUser: false,
            };
            setMessages((prev) => {
              // Не добавляем, если уже есть сообщение с таким id
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            if (!isOpen) setUnreadCount((c) => c + 1);
          }
        } catch (e) {
          console.error("Ошибка при разборе сообщения WS:", e);
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        wsRef.current = null;
        if (event.code !== 1000) {
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connectWebSocket();
          }, 5000);
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };

      return ws;
    } catch (error) {
      console.error("Ошибка при создании WebSocket:", error);
      return null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const ws = connectWebSocket();
      return () => {
        if (wsRef.current) {
          wsRef.current.close(1000, "Chat closed");
          wsRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };
    }
  }, [isOpen, connectWebSocket]);

  // 11. Отправка "прочитано" при открытии
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      const sendReadStatus = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({ type: "read", userId: userIdRef.current })
          );
        }
      };
      if (wsRef.current?.readyState === WebSocket.CONNECTING) {
        wsRef.current.addEventListener("open", sendReadStatus);
        return () => {
          wsRef.current?.removeEventListener("open", sendReadStatus);
        };
      } else {
        sendReadStatus();
      }
    }
  }, [isOpen]);

  // 12. Автопрокрутка вниз
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // 13. Отправка текстового сообщения
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const sendMessage = () => {
      const message: Message = {
        id: uuidv4(),
        text: newMessage.trim(),
        type: "text",
        timestamp: Date.now(),
        isRead: false,
        fromUser: true,
      };
      setMessages((prev) => [...prev, message]);
      setNewMessage("");

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "message",
            text: message.text,
            timestamp: message.timestamp,
            id: message.id, // передаём клиентский id, чтобы сервер не дублировал
          })
        );
      } else {
        console.error("WebSocket не готов к отправке");
      }
    };

    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      wsRef.current.addEventListener("open", sendMessage);
    } else {
      sendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const groupMessagesByDate = () => {
    const groups: { [date: string]: Message[] } = {};
    messages.forEach((message) => {
      const dateStr = formatDate(message.timestamp);
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(message);
    });
    return groups;
  };
  const messageGroups = groupMessagesByDate();

  // Добавляем приветственное сообщение при первом открытии
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: uuidv4(),
        text: "Привет! 👋 Я готов помочь вам с вашим проектом. Расскажите, какую идею вы хотите реализовать?",
        type: "text",
        timestamp: Date.now(),
        isRead: true,
        fromUser: false,
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen]);

  // Обновляем счетчик непрочитанных сообщений
  useEffect(() => {
    const unreadMessages = messages.filter(msg => !msg.isRead && !msg.fromUser).length;
    if (!isOpen) {
      setUnreadCount(unreadMessages);
    }
  }, [messages, isOpen]);

  // Обновляем статус прочтения при открытии чата
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      const updatedMessages = messages.map(msg => ({
        ...msg,
        isRead: true
      }));
      setMessages(updatedMessages);
      
      // Отправляем статус прочтения на сервер
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({ type: "read", userId: userIdRef.current })
        );
      }
    }
  }, [isOpen]);

  // Обновляем состояние при изменении внешнего пропса
  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setIsOpen(externalIsOpen);
    }
  }, [externalIsOpen]);

  // Обработчик закрытия чата
  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  return (
    <>
      {/* Круглая кнопка поддержки с улучшенной анимацией */}
      {!isOpen && !externalIsOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white w-16 h-16 rounded-full shadow-xl flex items-center justify-center hover:from-indigo-700 hover:to-purple-700 transition-all duration-500 transform hover:scale-110 chat-button ${
            showButton ? 'chat-button-enter' : 'chat-button-exit'
          }`}
          style={{
            display: showButton ? 'flex' : 'none',
          }}
          aria-label="Открыть чат поддержки"
        >
          <div className="relative w-7 h-7 flex items-center justify-center">
            {icons.map((icon, idx) => (
              <i
                key={icon.class}
                className={`${icon.class} absolute text-xl transition-all duration-700 ease-in-out ${
                  idx === iconIndex 
                    ? `opacity-100 scale-100 ${isTransitioning ? 'icon-morph' : ''}` 
                    : 'opacity-0 scale-50'
                }`}
              />
            ))}
          </div>
          
          {/* Улучшенный бейдж с анимацией */}
          {unreadCount > 0 && (
            <span 
              className="notification-badge"
              style={{
                animation: 'notificationPulse 1s infinite',
                transform: 'scale(1)',
                opacity: 1
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          
          {/* Эффект свечения при наведении */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 hover:opacity-30 transition-opacity duration-300 animate-pulse"></div>
        </button>
      )}

      {/* Окно чата */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 slide-in-from-right-4 duration-500">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm h-[80vh] sm:w-96 sm:h-[600px] flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Шапка чата с градиентом */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-3 animate-pulse ${
                    isConnected ? "bg-green-400 shadow-green-400/50" : "bg-red-400 shadow-red-400/50"
                  }`}
                  style={{
                    boxShadow: `0 0 10px ${isConnected ? '#4ade80' : '#f87171'}`,
                  }}
                />
                <div>
                  <h3 className="font-semibold text-lg">Чат поддержки</h3>
                  <button
                    onClick={() => setShowTopicForm(true)}
                    className="text-sm opacity-80 hover:opacity-100 transition-opacity duration-200 underline decoration-dotted"
                  >
                    Тема: {form.topic || "Без темы"} (изменить)
                  </button>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-200 transition-colors duration-200 p-2 rounded-full hover:bg-white/20"
                aria-label="Закрыть чат"
              >
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            {/* Форма имени/темы */}
            {showForm ? (
              <div className="p-6 flex-1 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                <form onSubmit={handleSubmitForm} className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-user text-white text-2xl"></i>
                    </div>
                    <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Давайте знакомиться!</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">Расскажите о своей идее, чтобы я смог лучше помочь</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="chat-name"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        <i className="fas fa-user mr-2"></i>Ваше имя
                      </label>
                      <input
                        id="chat-name"
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, name: e.target.value }))
                        }
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:ring-opacity-50 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm transition-all duration-200"
                        placeholder="Введите ваше имя"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="chat-topic"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        <i className="fas fa-comment-dots mr-2"></i>Тема обращения
                      </label>
                      <input
                        id="chat-topic"
                        type="text"
                        value={form.topic}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, topic: e.target.value }))
                        }
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:ring-opacity-50 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm transition-all duration-200"
                        placeholder="О чём хотите поговорить?"
                        required
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <i className="fas fa-paper-plane mr-2"></i>
                    Начать чат
                  </button>
                </form>
              </div>
            ) : (
              <>
                {/* Сообщения */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                  {Object.entries(messageGroups).map(([date, msgs]) => (
                    <div key={date}>
                      <div className="text-center text-sm text-gray-500 dark:text-gray-400 my-4 relative">
                        <span className="bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                          {date}
                        </span>
                      </div>
                      {msgs.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.fromUser ? "justify-end" : "justify-start"
                          } mb-3 animate-in slide-in-from-bottom-2 duration-300`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl p-4 shadow-md ${
                              msg.fromUser
                                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-md"
                                : "bg-white text-gray-900 dark:bg-gray-800 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-700"
                            }`}
                          >
                            <div className="text-sm leading-relaxed">{msg.text}</div>

                            {/* Фото */}
                            {msg.type === "photo" &&
                              (() => {
                                const localFile = tempFiles.find(
                                  (f) => f.id === msg.fileId
                                );
                                const src = localFile
                                  ? localFile.preview!
                                  : `${serverOrigin}/file/${msg.fileId}`;
                                return (
                                  <img
                                    src={src}
                                    alt={msg.text}
                                    className="mt-3 rounded-xl max-w-full max-h-64 object-contain cursor-pointer hover:scale-105 transition-transform duration-200 shadow-lg"
                                    onClick={() => {
                                      if (localFile) {
                                        setShowFilePreview(localFile);
                                      } else {
                                        setShowFilePreview({
                                          id: msg.fileId!,
                                          name: msg.text,
                                          type: "photo",
                                          url: `${serverOrigin}/file/${msg.fileId}`,
                                          preview: `${serverOrigin}/file/${msg.fileId}`,
                                        });
                                      }
                                    }}
                                  />
                                );
                              })()}

                            {/* Файл */}
                            {msg.type === "file" &&
                              (() => {
                                const localFile = tempFiles.find(
                                  (f) => f.id === msg.fileId
                                );
                                const href = localFile
                                  ? localFile.url
                                  : `${serverOrigin}/file/${msg.fileId}`;
                                return (
                                  <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
                                    <a
                                      href={href}
                                      download
                                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center"
                                    >
                                      <i className="fas fa-file-download mr-2"></i>
                                      {msg.text}
                                    </a>
                                  </div>
                                );
                              })()}

                            <div className="text-xs opacity-75 mt-2 flex items-center justify-between">
                              <span>{formatTime(msg.timestamp)}</span>
                              {msg.fromUser && (
                                <i className={`fas ${msg.isRead ? 'fa-check-double text-blue-300' : 'fa-check'} ml-2`}></i>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Форма ввода сообщения */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                >
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:ring-opacity-50 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm transition-all duration-200"
                      placeholder="Введите сообщение..."
                    />
                    <label className="cursor-pointer flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 transform hover:scale-105">
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                      />
                      <i className="fas fa-paperclip text-gray-500 dark:text-gray-300 text-lg"></i>
                    </label>
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white w-12 h-12 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      <i className="fas fa-paper-plane"></i>
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Превью файлов */}
          {showFilePreview && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-4xl max-h-[90vh] shadow-2xl animate-in zoom-in-95 duration-300">
                <img
                  src={showFilePreview.preview}
                  alt={showFilePreview.name}
                  className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-lg"
                />
                <div className="flex justify-between items-center mt-4">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 truncate">
                    {showFilePreview.name}
                  </h4>
                  <button
                    onClick={() => setShowFilePreview(null)}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    <i className="fas fa-times mr-2"></i>
                    Закрыть
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Изменение темы */}
          {showTopicForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl w-96 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-edit text-white text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Изменить тему</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">Расскажите, о чём хотите поговорить</p>
                </div>
                
                <input
                  type="text"
                  value={form.topic}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, topic: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:ring-opacity-50 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm mb-6 transition-all duration-200"
                  placeholder="Новая тема обращения"
                />
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowTopicForm(false)}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-all duration-200 transform hover:scale-105"
                  >
                    <i className="fas fa-times mr-2"></i>
                    Отмена
                  </button>
                  <button
                    onClick={() => {
                      setShowTopicForm(false);
                      wsRef.current?.send(
                        JSON.stringify({ type: "update_topic", topic: form.topic })
                      );
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    <i className="fas fa-save mr-2"></i>
                    Сохранить
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Chat;