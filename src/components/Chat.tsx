import React, { useState, useEffect, useRef } from "react";
import {
  useWebSocketConnection,
  Message,
  FormState,
  FileData,
} from "../hooks/useWebSocketConnection";
import { useTranslation } from "react-i18next";
import "./Chat.css";

interface ChatProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  webSocketConnection: ReturnType<typeof useWebSocketConnection>;
}

const Chat: React.FC<ChatProps> = ({
  isOpen: externalIsOpen,
  onClose,
  onOpen,
  webSocketConnection,
}) => {
  const {
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
  } = webSocketConnection;

  const { t } = useTranslation();

  const [newMessage, setNewMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showFilePreview, setShowFilePreview] = useState<FileData | null>(null);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [isFormRequired, setIsFormRequired] = useState(false);
  const [chatOpenedOnce, setChatOpenedOnce] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  // Появление кнопки после скролла ниже 80px
  const [showButton, setShowButton] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Обработка виртуальной клавиатуры на мобильных
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 640;
      if (isMobile) {
        const viewportHeight =
          window.visualViewport?.height || window.innerHeight;
        const windowHeight = window.innerHeight;
        const keyboardHeight = windowHeight - viewportHeight;

        setIsKeyboardOpen(keyboardHeight > 150);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
    } else {
      window.addEventListener("resize", handleResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
      } else {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  // Анимация иконок внутри круглой кнопки
  const icons = [
    { class: "fas fa-hands-helping" },
    { class: "fas fa-lightbulb" },
    { class: "fas fa-comments" },
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

  // Проверяем нужно ли показывать форму при попытке отправить сообщение
  const isFormFilled = Boolean(form.name) && Boolean(form.topic);

  // Проверяем, новый ли это пользователь (есть ли приветственное сообщение)
  const isNewUser =
    localStorage.getItem("chat_is_new_user") === "true" && hasWelcomeMessage;

  // Для новых пользователей не показываем форму сразу, только при попытке написать
  const shouldShowFormImmediately = !isNewUser && !isFormFilled;

  // Отправка формы
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const success = sendForm(form);
    if (success) {
      setShowForm(false);
      setIsFormRequired(false);
    }
  };

  // Загрузка файла
  const handleFileUpload = async (file: File) => {
    if (!isFormFilled) {
      setIsFormRequired(true);
      setShowForm(true);
      return;
    }
    sendFile(file);
  };

  // Обработчик клика на поле ввода - показываем форму если не заполнена
  const handleInputFocus = () => {
    if (!isFormFilled) {
      setIsFormRequired(true);
      setShowForm(true);
    }
  };

  // Отправка "прочитано" при открытии чата
  useEffect(() => {
    if (isOpen) {
      markAsRead();
    }
  }, [isOpen, markAsRead]);

  // Автопрокрутка вниз
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Отправка текстового сообщения
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (!isFormFilled) {
      setIsFormRequired(true);
      setShowForm(true);
      return;
    }

    const success = sendMessage(newMessage);
    if (success) {
      setNewMessage("");
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

  // Обработчик открытия чата
  const handleOpenChat = () => {
    setIsOpen(true);
    setIsOpening(true);
    setChatOpenedOnce(true);
    onOpen?.();

    // через 400 мс убираем флаг открытия
    setTimeout(() => {
      setIsOpening(false);
    }, 400);
  };

  // Обработчик закрытия чата
  const handleClose = () => {
    setIsClosing(true);

    // через 400 мс убираем окно и сбрасываем флаги
    setTimeout(() => {
      setIsOpen(false);
      setShowForm(false);
      setIsFormRequired(false);
      setIsClosing(false);
      onClose?.();
    }, 400);
  };

  // Синхронизация с внешним состоянием
  useEffect(() => {
    if (externalIsOpen !== undefined) {
      if (externalIsOpen) {
        handleOpenChat();
      } else {
        handleClose();
      }
    }
  }, [externalIsOpen]);

  return (
    <>
      {/* Круглая кнопка поддержки с улучшенной анимацией */}
      {!isOpen && !externalIsOpen && (
        <button
          onClick={handleOpenChat}
          className={`fixed bottom-6 right-6 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white w-16 h-16 rounded-full shadow-xl flex items-center justify-center hover:from-indigo-700 hover:to-purple-700 transition-all duration-500 transform hover:scale-110 chat-button ${
            showButton ? "chat-button-enter" : "chat-button-exit"
          }`}
          style={{
            display: showButton ? "flex" : "none",
          }}
          aria-label={t("chat.support_label")}
        >
          <div className="relative w-7 h-7 flex items-center justify-center">
            {icons.map((icon, idx) => (
              <i
                key={icon.class}
                className={`${icon.class} absolute text-xl transition-all duration-700 ease-in-out ${
                  idx === iconIndex
                    ? `opacity-100 scale-100 ${isTransitioning ? "icon-morph" : ""}`
                    : "opacity-0 scale-50"
                }`}
              />
            ))}
          </div>

          {/* Улучшенный бейдж с анимацией */}
          {unreadCount > 0 && (
            <span
              className="notification-badge"
              style={{
                animation: "notificationPulse 1s infinite",
                transform: "scale(1)",
                opacity: 1,
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}

          {/* Эффект свечения при наведении */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 hover:opacity-30 transition-opacity duration-300 animate-pulse"></div>
        </button>
      )}

      {/* Окно чата */}
      {isOpen && (
        <div
          ref={chatWindowRef}
          className={`chat-window ${
            isOpening ? "opening" : ""
          } ${isClosing ? "closing" : ""} ${
            isKeyboardOpen ? "keyboard-open" : ""
          }`}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full h-full flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Шапка чата с градиентом */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-3 animate-pulse ${
                    isConnected
                      ? "bg-green-400 shadow-green-400/50"
                      : "bg-red-400 shadow-red-400/50"
                  }`}
                  style={{
                    boxShadow: `0 0 10px ${
                      isConnected ? "#4ade80" : "#f87171"
                    }`,
                  }}
                />
                <div>
                  <h3 className="font-semibold text-lg">
                    {t("chat.support")}
                  </h3>
                  <button
                    onClick={() => setShowTopicForm(true)}
                    className="text-sm opacity-80 hover:opacity-100 transition-opacity duration-200 underline decoration-dotted"
                  >
                    {t("chat.topic")}: {form.topic || t("chat.no_topic")} (
                    {t("chat.change_topic")})
                  </button>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-200 transition-colors duration-200 p-2 rounded-full hover:bg-white/20"
                aria-label={t("chat.close")}
              >
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            {/* Форма имени/темы - показывается только при попытке отправить сообщение */}
            {showForm && isFormRequired ? (
              <div className="p-6 flex-1 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 chat-form-scrollable">
                <form onSubmit={handleSubmitForm} className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-user text-white text-2xl"></i>
                    </div>
                    <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                      {t("chat.lets_meet")}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                      {t("chat.form_description")}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="chat-name"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        <i className="fas fa-user mr-2"></i>
                        {t("chat.your_name")}
                      </label>
                      <input
                        id="chat-name"
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, name: e.target.value }))
                        }
                        className="chat-input-field no-zoom w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:ring-opacity-50 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                        style={{ fontSize: "16px" }}
                        placeholder={t("chat.enter_name")}
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="chat-topic"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        <i className="fas fa-comment-dots mr-2"></i>
                        {t("chat.topic_label")}
                      </label>
                      <input
                        id="chat-topic"
                        type="text"
                        value={form.topic}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, topic: e.target.value }))
                        }
                        className="chat-input-field no-zoom w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:ring-opacity-50 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                        style={{ fontSize: "16px" }}
                        placeholder={t("chat.topic_placeholder")}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setIsFormRequired(false);
                      }}
                      className="flex-1 px-6 py-4 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                    >
                      {t("chat.cancel")}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <i className="fas fa-paper-plane mr-2"></i>
                      {t("chat.continue")}
                    </button>
                  </div>
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
                            <div className="text-sm leading-relaxed">
                              {msg.text}
                            </div>

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
                                <i
                                  className={`fas ${
                                    msg.isRead
                                      ? "fa-check-double text-blue-300"
                                      : "fa-check"
                                  } ml-2`}
                                ></i>
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
                      onFocus={handleInputFocus}
                      className="chat-input-field no-zoom flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:ring-opacity-50 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                      style={{ fontSize: "16px" }}
                      placeholder={
                        isFormFilled
                          ? t("chat.enter_message")
                          : t("chat.fill_form")
                      }
                      readOnly={!isFormFilled}
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
                    {t("chat.close")}
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
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    {t("chat.change_topic_title")}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                    {t("chat.change_topic_desc")}
                  </p>
                </div>

                <input
                  type="text"
                  value={form.topic}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, topic: e.target.value }))
                  }
                  className="chat-input-field no-zoom w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:ring-opacity-50 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-6 transition-all duration-200"
                  style={{ fontSize: "16px" }}
                  placeholder={t("chat.new_topic")}
                />

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowTopicForm(false)}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-all duration-200 transform hover:scale-105"
                  >
                    <i className="fas fa-times mr-2"></i>
                    {t("chat.cancel")}
                  </button>
                  <button
                    onClick={() => {
                      setShowTopicForm(false);
                      updateTopic(form.topic);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    <i className="fas fa-save mr-2"></i>
                    {t("chat.save")}
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
