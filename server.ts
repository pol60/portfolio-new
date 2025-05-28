import express, { Request, Response, RequestHandler } from "express";
import http from "http";
import WebSocket, { WebSocketServer } from "ws";
import TelegramBot from "node-telegram-bot-api";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch"; // npm i node-fetch@2, чтобы скачивать файлы из Telegram
import dotenv from "dotenv";
import path from "path";
dotenv.config();

// --------------- Конфигурация ---------------
const token = process.env.TELEGRAM_BOT_TOKEN;
const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
const isProduction = process.env.NODE_ENV === "production";
const productionDomain = process.env.PRODUCTION_DOMAIN;
const cloudflareFrontendUrl = process.env.CLOUDFLARE_FRONTEND_URL;
const cloudflareBackendUrl = process.env.CLOUDFLARE_BACKEND_URL;

if (!token || !adminChatId) {
  console.error(
    "Ошибка: Не указан TELEGRAM_BOT_TOKEN или TELEGRAM_ADMIN_CHAT_ID в .env",
  );
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
const app = express();

// CORS настройки в зависимости от окружения
if (!isProduction) {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    cloudflareFrontendUrl,
  ].filter((origin): origin is string => Boolean(origin));

  console.log("Разрешенные origins для CORS:", allowedOrigins);

  app.use(
    cors({
      origin: allowedOrigins,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );
} else if (productionDomain) {
  app.use(
    cors({
      origin: productionDomain,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );
}

app.use(express.json());

// В продакшене отдаем статические файлы
if (isProduction) {
  const clientDistPath = path.resolve(__dirname, "dist");
  app.use(express.static(clientDistPath));
}

const server = http.createServer(app);

const PING_INTERVAL = 30000; // 30 секунд
// -----------------------------------------------

// --------------- Интерфейсы и хранилища ---------------
interface Message {
  id: string;
  text: string;
  type: "text" | "photo" | "file";
  fileId?: string;
  timestamp: number;
  isRead: boolean;
  fromUser: boolean; // true = от пользователя, false = от администратора
}

/*
 На всякий случай, чтобы отличать «фото» от «произвольного файла» при отдаче,
 нам нужно хранить не только Buffer, но и имя+MIME.
*/
interface StoredFile {
  buffer: Buffer;
  mime: string;
  filename: string;
}

interface UserData {
  id: string;
  name: string;
  topic: string;
  messages: Message[]; // вся история (включая фото/файлы)
  pendingAdminMessages: Message[]; // админские сообщения, если клиент оффлайн
  files: Map<string, StoredFile>; // ключ — internal fileId, значение = buffer+mime+filename
  hasLeftSite: boolean; // флаг того, что пользователь покинул сайт
  lastSeenTimestamp: number; // время последней активности
}

interface ClientState {
  ws: WebSocket;
  isAlive: boolean;
  lastPing: number;
  userId: string;
  lastMessageTimestamp: number;
  disconnectTimeout?: NodeJS.Timeout;
}

const usersStorage = new Map<string, UserData>();
const messageToUserMap = new Map<number, string>(); // mapping Telegram-message_id → userId
const clients = new Map<string, ClientState>();
// -------------------------------------------------------

// --------------- WebSocket-сервер ---------------
const wss = new WebSocketServer({
  server,
  path: "/ws",
  clientTracking: true,
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3,
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024,
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10,
    concurrencyLimit: 10,
    threshold: 1024,
  },
  verifyClient: (info, callback) => {
    const origin = info.origin || info.req.headers.origin;
    console.log("WebSocket connection attempt from origin:", origin);

    if (!isProduction) {
      const allowedOrigins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        cloudflareFrontendUrl,
      ].filter((origin): origin is string => Boolean(origin));

      console.log("Allowed WebSocket origins:", allowedOrigins);

      if (origin && allowedOrigins.includes(origin)) {
        callback(true);
      } else {
        console.log("WebSocket connection rejected from origin:", origin);
        callback(false, 403, "Forbidden");
      }
    } else if (productionDomain && origin === productionDomain) {
      callback(true);
    } else {
      console.log("WebSocket connection rejected from origin:", origin);
      callback(false, 403, "Forbidden");
    }
  },
});

const serverStartTimestamp = Date.now();

// Эндпоинт, который возвращает «метку» старта
app.get("/server-start", (_req: Request, res: Response) => {
  res.json({ serverStart: serverStartTimestamp });
});

wss.on("connection", (ws: WebSocket, req: http.IncomingMessage) => {
  const url = new URL(req.url || "", `http://${req.headers.host}`);
  const userId = url.searchParams.get("userId") || uuidv4();

  console.log(`WebSocket подключение: userId = ${userId}`);

  // Проверяем, существует ли уже UserData для этого userId
  const alreadyHasUserData = usersStorage.has(userId);
  // Ищем «живое» соединение в clients (если старое соединение ещё не удалено)
  const existingClientState = clients.get(userId);

  // Проверяем, это первое подключение пользователя к сайту или переподключение
  const isFirstSiteVisit = !alreadyHasUserData;

  // Если была предыдущая сессия для этого userId, отменяем её «таймер отключения»
  if (existingClientState?.disconnectTimeout) {
    clearTimeout(existingClientState.disconnectTimeout);
    console.log(`Отменён таймер отключения для userId = ${userId}`);
  }

  // Если уже есть активное соединение, аккуратно закрываем старое ws
  if (existingClientState) {
    if (existingClientState.ws.readyState === WebSocket.OPEN) {
      console.log(`Закрываем старое соединение для userId = ${userId}`);
      existingClientState.ws.close(1000, "New connection");
    }
    clients.delete(userId);
  }

  // Получаем или создаём UserData
  let userData = usersStorage.get(userId);
  if (!userData) {
    userData = {
      id: userId,
      name: "Аноним",
      topic: "Без темы",
      messages: [],
      pendingAdminMessages: [],
      files: new Map<string, StoredFile>(),
      hasLeftSite: false,
      lastSeenTimestamp: Date.now(),
    };
    usersStorage.set(userId, userData);
  }

  // Проверяем, возвращается ли пользователь после покидания сайта
  const isReturningUser = userData.hasLeftSite && alreadyHasUserData;

  // Обновляем статус пользователя
  userData.hasLeftSite = false;
  userData.lastSeenTimestamp = Date.now();

  // Сохраняем новое состояние клиента
  const clientState: ClientState = {
    ws,
    isAlive: true,
    lastPing: Date.now(),
    userId,
    lastMessageTimestamp: Date.now(),
  };
  clients.set(userId, clientState);

  // 1) Отправляем историю + количество непрочитанных сообщений
  const unreadCount = userData.pendingAdminMessages.length;
  ws.send(
    JSON.stringify({
      type: "init",
      history: userData.messages,
      // pending: userData.pendingAdminMessages, // больше не отправляем pending отдельно
      unreadCount: unreadCount,
    }),
  );

  // 2) Больше НЕ отправляем pendingAdminMessages отдельными admin_message!
  // userData.pendingAdminMessages.forEach((msg) => {
  //   ws.send(
  //     JSON.stringify({
  //       action: "admin_message",
  //       contentType: msg.type,
  //       id: msg.id,
  //       text: msg.text,
  //       fileId: msg.fileId,
  //       timestamp: msg.timestamp,
  //       isRead: false, // Оставляем как непрочитанное для уведомления
  //       fromUser: false,
  //     }),
  //   );
  // });
  // НЕ очищаем pendingAdminMessages сразу - они будут очищены при markAsRead

  // 3) Логика для нового пользователя vs переподключения vs возврата
  if (isFirstSiteVisit) {
    console.log(`Первый вход на сайт: userId = ${userId}`);

    // Новый пользователь - отправляем приветственное сообщение
    const welcomeMessage: Message = {
      id: uuidv4(),
      text: "Привет! 👋 Я готов помочь вам с вашим проектом. Расскажите, какую идею вы хотите реализовать?",
      type: "text",
      timestamp: Date.now(),
      isRead: true, // Сразу помечаем как прочитанное!
      fromUser: false,
    };
    userData.messages.push(welcomeMessage);

    // Отправляем приветственное сообщение клиенту
    ws.send(
      JSON.stringify({
        action: "welcome_message",
        id: welcomeMessage.id,
        text: welcomeMessage.text,
        timestamp: welcomeMessage.timestamp,
        isRead: true, // Сразу помечаем как прочитанное!
      }),
    );

    // Уведомляем администратора только при первом входе
    bot
      .sendMessage(
        adminChatId!,
        `🟢 Новый пользователь зашёл на сайт. ID: ${userId}`,
      )
      .catch(console.error);
  } else if (isReturningUser) {
    console.log(`Пользователь вернулся на сайт: userId = ${userId}`);

    // Уведомляем администратора о возврате
    bot
      .sendMessage(
        adminChatId!,
        `🟡 Пользователь вернулся на сайт. ID: ${userId}`,
      )
      .catch(console.error);
  } else {
    console.log(`Переподключение WebSocket: userId = ${userId}`);
    // При обычном переподключении WebSocket не отправляем никаких уведомлений
  }

  // 4) Пингаем клиента каждые 30 сек, чтобы отследить «мертвые» коннекты
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }, PING_INTERVAL);

  ws.on("pong", () => {
    const st = clients.get(userId);
    if (st) {
      st.lastPing = Date.now();
    }
  });

  // --------------- Обработка сообщений от клиента (React) ---------------
  ws.on("message", async (rawData: WebSocket.RawData) => {
    try {
      const data = JSON.parse(rawData.toString());
      const st = clients.get(userId);
      if (!st) {
        console.error(`Нет clientState для userId = ${userId}`);
        return;
      }
      st.lastMessageTimestamp = Date.now();
      st.isAlive = true;

      // --- Обработка формы (имя + тема) ---
      if (data.type === "form") {
        userData!.name = data.name;
        userData!.topic = data.topic;
        ws.send(JSON.stringify({ type: "form_ack", formId: data.formId }));
        return;
      }

      // --- Обработка изменения темы ---
      if (data.type === "update_topic") {
        userData!.topic = data.topic;
        bot
          .sendMessage(
            adminChatId!,
            `🔄 Пользователь изменил тему на: ${data.topic}\nID: ${userId}`,
          )
          .catch(console.error);
        return;
      }

      // --- Обработка «прочитано» ---
      if (data.type === "read") {
        userData?.messages.forEach((m) => (m.isRead = true));
        // Очищаем pending сообщения при прочтении
        userData!.pendingAdminMessages = [];
        return;
      }

      // --- Обработка реального покидания сайта ---
      if (data.type === "user_leaving_site") {
        console.log(`Пользователь покидает сайт: userId = ${userId}`);

        // Устанавливаем флаг что пользователь покинул сайт
        userData!.hasLeftSite = true;

        // Отправляем уведомление администратору
        bot
          .sendMessage(
            adminChatId!,
            `🔴 Пользователь покинул сайт. ID: ${userId}`,
          )
          .catch(console.error);
        return;
      }

      // --- Обработка возврата на сайт ---
      if (data.type === "user_returned_to_site") {
        console.log(`Пользователь вернулся на сайт: userId = ${userId}`);

        // Сбрасываем флаг покидания сайта
        userData!.hasLeftSite = false;
        userData!.lastSeenTimestamp = Date.now();

        // Уведомляем администратора о возврате
        bot
          .sendMessage(
            adminChatId!,
            `🟡 Пользователь вернулся на сайт. ID: ${userId}`,
          )
          .catch(console.error);

        // Больше не отправляем сообщение "Вы готовы продолжить обсуждение вашей идеи?"
        return;
      }

      // --- Обработка закрытия чата (НЕ покидания сайта) ---
      if (data.type === "close_chat") {
        console.log(
          `Пользователь закрыл чат (но остался на сайте): userId = ${userId}`,
        );
        // НЕ отправляем уведомление о покидании сайта
        return;
      }

      // --- Обработка «файла» (фото или документ) от клиента ---
      if (data.type === "file") {
        try {
          // 1) декодируем base64 → Buffer
          const fileBuffer = Buffer.from(data.data, "base64");
          const mime = data.fileType as string; // e.g. "image/png" или "application/pdf"
          const filename = data.fileName as string; // исходное имя

          // 2) сохраняем в userData.files под ключом data.fileId
          userData!.files.set(data.fileId, {
            buffer: fileBuffer,
            mime,
            filename,
          });

          // 3) отправляем в Telegram администраторам
          const caption = `📁 Новый файл\nИмя: ${userData!.name}\nТема: ${userData!.topic}\nФайл: ${filename}`;
          let sentMsg: TelegramBot.Message;

          if (mime.startsWith("image/")) {
            sentMsg = await bot.sendPhoto(adminChatId!, fileBuffer, {
              caption,
            });
          } else {
            sentMsg = await bot.sendDocument(adminChatId!, fileBuffer, {
              caption,
            });
          }
          // Запоминаем связь: Telegram-message_id → userId
          messageToUserMap.set(sentMsg.message_id, userId);

          // 4) формируем объект Message и сохраняем в истории
          const newMessage: Message = {
            id: data.fileId,
            text: filename,
            type: mime.startsWith("image/") ? "photo" : "file",
            fileId: data.fileId,
            timestamp: Date.now(),
            isRead: false,
            fromUser: true,
          };
          userData!.messages.push(newMessage);

          // 5) подтверждаем клиенту, что файл успешно сохранён/переслан
          ws.send(
            JSON.stringify({
              type: "file_ack",
              fileId: data.fileId,
              success: true,
            }),
          );
        } catch (err) {
          console.error("Ошибка при обработке data.type='file':", err);
          ws.send(
            JSON.stringify({
              type: "file_ack",
              fileId: data.fileId,
              success: false,
            }),
          );
        }
        return;
      }

      // --- Обработка «text message» от клиента ---
      if (data.type === "message") {
        // Теперь используем client.id вместо генерации нового
        const newMessage: Message = {
          id: data.id,
          text: data.text,
          type: "text",
          timestamp: Date.now(),
          isRead: false,
          fromUser: true,
        };
        userData!.messages.push(newMessage);

        // Отправляем админу в Telegram
        const msgText = `📨 Новое сообщение\nИмя: ${userData!.name}\nТема: ${userData!.topic}\nСообщение: ${data.text}`;
        const sentMsg = await bot.sendMessage(adminChatId!, msgText);
        messageToUserMap.set(sentMsg.message_id, userId);
        return;
      }
    } catch (error) {
      console.error("Ошибка при разборе WebSocket-сообщения:", error);
    }
  });

  // --- Закрытие WebSocket ---
  ws.on("close", (code: number, reason: string) => {
    console.log(
      `WS закрыт. userId=${userId}, код=${code}, причина='${reason}'`,
    );
    clearInterval(pingInterval);

    // Просто удаляем клиента из списка активных
    // Уведомления о покидании сайта отправляются только через события beforeunload/visibilitychange
    const currentClient = clients.get(userId);
    if (currentClient?.ws === ws) {
      clients.delete(userId);
      console.log(`WebSocket соединение закрыто для userId=${userId}`);
    }
  });

  ws.on("error", (err) => {
    console.error(`WS error для userId=${userId}:`, err);
  });
});
// ------------------------------------------------

// --------------- Ответы администратора ---------------
bot.on("message", async (msg: TelegramBot.Message) => {
  // Если это не reply → игнорируем
  if (!msg.reply_to_message) return;

  // Смотрим, по какому Telegram-сообщению админ отвечает
  const repliedTelegramId = msg.reply_to_message.message_id;
  const userId = messageToUserMap.get(repliedTelegramId);
  if (!userId) return;

  const userData = usersStorage.get(userId);
  if (!userData) return;

  const client = clients.get(userId);

  // 1) Текстовый ответ (msg.text, без фото и без document)
  if (msg.text && !msg.photo && !msg.document) {
    const newMessage: Message = {
      id: uuidv4(),
      text: msg.text,
      type: "text",
      timestamp: Date.now(),
      isRead: false,
      fromUser: false,
    };
    // Сохраняем в истории
    userData.messages.push(newMessage);

    if (client?.ws.readyState === WebSocket.OPEN) {
      client.ws.send(
        JSON.stringify({
          action: "admin_message",
          contentType: newMessage.type, // "text"
          id: newMessage.id,
          text: newMessage.text,
          timestamp: newMessage.timestamp,
          isRead: true,
          fromUser: false,
        }),
      );
      newMessage.isRead = true;
    } else {
      userData.pendingAdminMessages.push(newMessage);
    }
    return;
  }

  // 2) Администратор прислал фото (msg.photo array)
  if (msg.photo && msg.photo.length > 0) {
    try {
      // Берём самый «большой» размер (последний элемент)
      const largestPhoto = msg.photo[msg.photo.length - 1];
      const fileIdTelegram = largestPhoto.file_id;
      const fileLink = await bot.getFileLink(fileIdTelegram);
      const response = await fetch(fileLink);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Определяем MIME (Telegram отдаёт всегда jpeg для photo-метода)
      const mime = "image/jpeg";
      // Генерируем свой internal fileId
      const localFileId = uuidv4();

      // Сохраняем buffer+mime+filename
      const filename = msg.caption || "photo_from_admin.jpg";
      userData.files.set(localFileId, {
        buffer,
        mime,
        filename,
      });

      const newMessage: Message = {
        id: localFileId,
        text: filename,
        type: "photo",
        fileId: localFileId,
        timestamp: Date.now(),
        isRead: false,
        fromUser: false,
      };
      // Сохраняем in истории
      userData.messages.push(newMessage);

      if (client?.ws.readyState === WebSocket.OPEN) {
        client.ws.send(
          JSON.stringify({
            action: "admin_message",
            contentType: newMessage.type, // "photo"
            id: newMessage.id,
            text: newMessage.text,
            fileId: newMessage.fileId,
            timestamp: newMessage.timestamp,
            isRead: true,
            fromUser: false,
          }),
        );
        newMessage.isRead = true;
      } else {
        userData.pendingAdminMessages.push(newMessage);
      }
    } catch (err) {
      console.error("Ошибка при получении фото от админа:", err);
    }
    return;
  }

  // 3) Администратор прислал документ (msg.document)
  if (msg.document) {
    try {
      const fileIdTelegram = msg.document.file_id;
      const fileLink = await bot.getFileLink(fileIdTelegram);
      const response = await fetch(fileLink);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const mime = msg.document.mime_type || "application/octet-stream";
      const localFileId = uuidv4();
      const filename = msg.document.file_name || "file_from_admin";

      userData.files.set(localFileId, {
        buffer,
        mime,
        filename,
      });

      const newMessage: Message = {
        id: localFileId,
        text: filename,
        type: "file",
        fileId: localFileId,
        timestamp: Date.now(),
        isRead: false,
        fromUser: false,
      };
      // Сохраняем в истории
      userData.messages.push(newMessage);

      if (client?.ws.readyState === WebSocket.OPEN) {
        client.ws.send(
          JSON.stringify({
            action: "admin_message",
            contentType: newMessage.type, // "file"
            id: newMessage.id,
            text: newMessage.text,
            fileId: newMessage.fileId,
            timestamp: newMessage.timestamp,
            isRead: true,
            fromUser: false,
          }),
        );
        newMessage.isRead = true;
      } else {
        userData.pendingAdminMessages.push(newMessage);
      }
    } catch (err) {
      console.error("Ошибка при получении документа от админа:", err);
    }
    return;
  }
});
// ------------------------------------------------------

// --------------- Endpoint для отдачи файлов ---------------
const fileHandler: RequestHandler = (req, res) => {
  const fileId = req.params.id;
  // Ищем, у какого пользователя хранится файл с этим fileId
  const userData = Array.from(usersStorage.values()).find((u) =>
    u.messages.some((m) => m.fileId === fileId),
  );

  if (!userData || !userData.files.has(fileId)) {
    res.status(404).send("File not found");
    return;
  }

  // Достаём сохранённый Buffer + mime + filename
  const stored = userData.files.get(fileId)!;
  const { buffer, mime, filename } = stored;

  if (mime.startsWith("image/")) {
    // Для фотографий возвращаем с Content-Type = реальный MIME
    res.setHeader("Content-Type", mime);
    res.send(buffer);
  } else {
    // Для прочих файлов – отдать как «скачать»
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  }
};

app.get("/file/:id", fileHandler);
// ---------------------------------------------------------

// Простой endpoint для проверки
app.get("/", (_req: Request, res: Response) => {
  res.send("Сервер чата работает");
});

if (isProduction) {
  // Обработка всех остальных маршрутов в продакшене
  app.get("*", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(
    `Server listening on port ${PORT} in ${isProduction ? "production" : "development"} mode`,
  );
});
