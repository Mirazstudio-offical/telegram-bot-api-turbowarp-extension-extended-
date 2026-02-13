(function (Scratch) {
    'use strict';

    if (!Scratch) throw new Error("Scratch API недоступен. Расширение Telegram Bot API невозиожно загрузить.");

    if (!Scratch.extensions.unsandboxed) throw new Error("Для стабильной и правильной работы требуется режим без песочницы.");

    const formatMessage = Scratch.translate;
    Scratch.translate.setup({
        en: {
            'name': 'Telegram Bot API',
            'init.label': 'Bot initialization',
            'init.text': 'initialize bot with token [TOKEN]',
            'startPolling': 'start polling every [SECONDS] sec',
            'stopPolling': 'stop polling'
        },
        ru: {
            'name': 'Telegram Bot API',
            'init.label': 'Инициализация бота',
            'init.text': 'инициализировать бота с токеном [TOKEN]',
            'startPolling': 'начать поллинг каждые [SECONDS] сек',
            'stopPolling': 'остановить поллинг'
        },
        de: { 'name': 'Telegram Bot API' },
        tr: { 'name': 'Telegram Bot API' },
        kk: { 'name': 'Telegram Bot API' }
    });

    class TelegramBotAPIExtension {
        constructor() {
            this.token = '';
            this.updates = [];
            this.offset = 0;
            this.pollingActive = false;
            this.pollingRunning = false;
            this.allUsers = new Set();
            this.recentUsers = [];
            this.maxRecentUsers = 10;
            this.lastCommand = "";
            this.inlineButtons = [[]];
            this.pollAnswers = [];
            this.dataBase = [];
            this.replyButtons = [];
            this.botCommands = [];
            this.lastActionResult = "{}";
        }

        getInfo() {
            return {
                id: 'TelegramBotAPI',
                name: formatMessage({ id: 'name', default: 'Telegram Bot API' }),
                menuIconURI: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Telegram_2019_Logo.svg/768px-Telegram_2019_Logo.svg.png",
                docsURI: "https://github.com/DBDev-git/TelegramBotAPI",
                color1: '#0088CC',
                color2: '#006699',
                blocks: [
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: formatMessage({ id: 'init.label', default: 'Bot initialization' })
                    },
                    {
                        opcode: 'initBot',
                        blockType: Scratch.BlockType.COMMAND,
                        text: formatMessage({ id: 'init.text', default: 'initialize bot with token [TOKEN]' }),
                        arguments: { TOKEN: { type: Scratch.ArgumentType.STRING, defaultValue: 'ТОКЕН_БОТА' } }
                    },
                    {
                        opcode: 'startPolling',
                        blockType: Scratch.BlockType.COMMAND,
                        text: formatMessage({ id: 'startPolling', default: 'start polling every [SECONDS] sec' }),
                        arguments: { SECONDS: { type: Scratch.ArgumentType.NUMBER, defaultValue: 2 } }
                    },
                    {
                        opcode: 'stopPolling',
                        blockType: Scratch.BlockType.COMMAND,
                        text: formatMessage({ id: 'stopPolling', default: 'stop polling' })
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "Отправка и изменение сообщений"
                    },
                    {
                        opcode: 'sendMessage',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'отправить сообщение [TEXT] с форматированием [PARSE_MODE] в чат [CHATID]',
                        arguments: {
                            TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: 'Привет!' },
                            PARSE_MODE: { type: Scratch.ArgumentType.STRING, menu: "PARSE_MODE_MENU" },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' }
                        }
                    },
                    {
                        opcode: "sendMessageWithInlineButtons",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "отправить сообщение [TEXT] с массивом кнопок [BUTTONS] -> JSON и с форматированием [PARSE_MODE] в чат [CHATID]",
                        arguments: {
                            TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: "Привет!" },
                            BUTTONS: { type: Scratch.ArgumentType.STRING, defaultValue: '[[{"text": "Кнопка 1", "callback_data": "data_1"}]]' },
                            PARSE_MODE: { type: Scratch.ArgumentType.STRING, menu: "PARSE_MODE_MENU" },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' }
                        }
                    },
                    {
                        opcode: "answerToMessage",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "ответить [TEXT] на сообщение с ID [MESSAGEID] с форматированием [PARSE_MODE] в чате [CHATID]",
                        arguments: {
                            TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: "Привет!" },
                            MESSAGEID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
                            PARSE_MODE: { type: Scratch.ArgumentType.STRING, menu: "PARSE_MODE_MENU" },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' }
                        }
                    },
                    {
                        opcode: "answerToMessageWithInlineButtons",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "ответить [TEXT] на сообщение с ID [MESSAGEID] с массивом кнопок [BUTTONS] -> JSON и с форматированием [PARSE_MODE] в чате [CHATID]",
                        arguments: {
                            TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: "Привет!" },
                            MESSAGEID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
                            BUTTONS: { type: Scratch.ArgumentType.STRING, defaultValue: '[[{"text": "Кнопка 1", "callback_data": "data_1"}]]' },
                            PARSE_MODE: { type: Scratch.ArgumentType.STRING, menu: "PARSE_MODE_MENU" },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' }
                        }
                    },
                    {
                        opcode: "editMessageText",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "изменить текст сообщения с ID [MESSAGEID] в чате [CHATID] на [TEXT]",
                        arguments: {
                            MESSAGEID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' },
                            TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: "Привет!" }
                        }
                    },
                    {
                        opcode: "editMessageReplyMarkup",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "заменить кнопки в сообщении с ID [MESSAGEID] в чате [CHATID] на новые [BUTTONS] -> JSON",
                        arguments: {
                            MESSAGEID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' },
                            BUTTONS: { type: Scratch.ArgumentType.STRING, defaultValue: '[[{"text": "Новая кнопка", "callback_data": "new_data"}]]' }
                        }
                    },
                    {
                        opcode: "deleteMessage",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "удалить сообщение с ID [MESSAGEID] из чата [CHATID]",
                        arguments: {
                            MESSAGEID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' }
                        }
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "Отправка медиа и других типов"
                    },
                    {
                        opcode: "sendChatAction",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "отправить действие [ACTION] в чат [CHATID]",
                        arguments: {
                            ACTION: { type: Scratch.ArgumentType.STRING, menu: "CHAT_ACTION_MENU" },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' }
                        }
                    },
                    {
                        opcode: "sendPhoto",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "отправить фото [URL] с текстом [TEXT] и форматированием [PARSE_MODE] в чат [CHATID]",
                        arguments: {
                            URL: { type: Scratch.ArgumentType.STRING, defaultValue: "https://example.com/photo.png" },
                            TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: "Привет!" },
                            PARSE_MODE: { type: Scratch.ArgumentType.STRING, menu: "PARSE_MODE_MENU" },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' }
                        }
                    },
                    {
                        opcode: "sendSticker",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "отправить стикер с ID [STICKERID] в чат [CHATID]",
                        arguments: {
                            STICKERID: { type: Scratch.ArgumentType.STRING, defaultValue: "CAACAgIAAxkBAAIT2Wfc4yJG7w8EJOBAI_Bhl2TjJNEQAAKZYQACxxxhSEMYJmeAkT6gNgQ" },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' }
                        }
                    },
                    {
                        opcode: 'sendAudio',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'отправить аудио [URL_OR_ID] с текстом [CAPTION] и форматированием [PARSE_MODE] в чат [CHATID]',
                        arguments: {
                            URL_OR_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'URL или File ID аудио' },
                            CAPTION: { type: Scratch.ArgumentType.STRING, defaultValue: '' },
                            PARSE_MODE: { type: Scratch.ArgumentType.STRING, menu: "PARSE_MODE_MENU" },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' }
                        }
                    },
                    {
                        opcode: 'sendDocument',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'отправить документ [URL_OR_ID] с текстом [CAPTION] и форматированием [PARSE_MODE] в чат [CHATID]',
                        arguments: {
                            URL_OR_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'URL или File ID документа' },
                            CAPTION: { type: Scratch.ArgumentType.STRING, defaultValue: '' },
                            PARSE_MODE: { type: Scratch.ArgumentType.STRING, menu: "PARSE_MODE_MENU" },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' }
                        }
                    },
                    {
                        opcode: 'sendVideo',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'отправить видео [URL_OR_ID] с текстом [CAPTION] и форматированием [PARSE_MODE] в чат [CHATID]',
                        arguments: {
                            URL_OR_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'URL или File ID видео' },
                            CAPTION: { type: Scratch.ArgumentType.STRING, defaultValue: '' },
                            PARSE_MODE: { type: Scratch.ArgumentType.STRING, menu: "PARSE_MODE_MENU" },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' }
                        }
                    },
                    {
                        opcode: 'sendVoice',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'отправить голосовое сообщение [URL_OR_ID] с текстом [CAPTION] и форматированием [PARSE_MODE] в чат [CHATID]',
                        arguments: {
                            URL_OR_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'URL или File ID голосового сообщения' },
                            CAPTION: { type: Scratch.ArgumentType.STRING, defaultValue: '' },
                            PARSE_MODE: { type: Scratch.ArgumentType.STRING, menu: "PARSE_MODE_MENU" },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' }
                        }
                    },
                    {
                        opcode: 'sendVideoNote',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'отправить видео-заметку [URL_OR_ID] в чат [CHATID]',
                        arguments: {
                            URL_OR_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'URL или File ID видео-заметки' },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' }
                        }
                    },
                    {
                        opcode: 'sendMediaGroup',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'отправить группу медиа [MEDIA_ARRAY_JSON] в чат [CHATID]',
                        arguments: {
                            MEDIA_ARRAY_JSON: { type: Scratch.ArgumentType.STRING, defaultValue: '[{"type": "photo", "media": "URL или File ID фото", "caption": "Описание"}, {"type": "video", "media": "URL или File ID видео"}]' },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' }
                        }
                    },
                    {
                        opcode: 'sendLocation',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'отправить локацию широта [LATITUDE] долгота [LONGITUDE] в чат [CHATID]',
                        arguments: {
                            LATITUDE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 55.751244 },
                            LONGITUDE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 37.617494 },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' }
                        }
                    },
                    {
                        opcode: 'sendDice',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'отправить кубик с эмодзи [EMOJI] в чат [CHATID]',
                        arguments: {
                            EMOJI: { type: Scratch.ArgumentType.STRING, menu: "DICE_EMOJI_MENU" },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' }
                        }
                    },
                    {
                        opcode: 'sendDiceAndGetValue',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'отправить кубик [EMOJI] в чат [CHATID] и получить значение',
                        arguments: {
                            EMOJI: { type: Scratch.ArgumentType.STRING, menu: "DICE_EMOJI_MENU" },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' }
                        }
                    },
                    {
                        opcode: "sendPoll",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "отправить опрос с вопросом [QUESTION] и с массивом вариантов ответа [OPTIONS] с настройками [ISANONIM] и [ALLOWSMULTIPLE] в чат [CHATID]",
                        arguments: {
                            QUESTION: { type: Scratch.ArgumentType.STRING, defaultValue: "Опрос" },
                            ISANONIM: { type: Scratch.ArgumentType.STRING, menu: "POLL_ISANONIM_MENU" },
                            ALLOWSMULTIPLE: { type: Scratch.ArgumentType.STRING, menu: "POLL_ALLOWSMULTIPLE_MENU" },
                            OPTIONS: { type: Scratch.ArgumentType.STRING, defaultValue: '["1","2","3"]' },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' }
                        }
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "Платежи"
                    },
                    {
                        opcode: "sendGift",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "отправить подарок [GIFT_ID] в чат [CHATID] с текстом [TEXT] и форматированием [PARSE_MODE]",
                        arguments: {
                            GIFT_ID: { type: Scratch.ArgumentType.STRING, defaultValue: "123" },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: "ID или @юзернейм" },
                            TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: "" },
                            PARSE_MODE: { type: Scratch.ArgumentType.STRING, menu: "PARSE_MODE_MENU" }
                        }
                    },
                    {
                        opcode: "getAvailableGifts",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "получить список доступных подарков (JSON)"
                    },
                    {
                        opcode: "createInvoiceLink",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "создать ссылку на оплату: [TITLE], [DESCRIPTION], payload [PAYLOAD], токен [PROVIDER_TOKEN], валюта [CURRENCY], цена [PRICE], подписка? [IS_SUBSCRIPTION]",
                        arguments: {
                            TITLE: { type: Scratch.ArgumentType.STRING, defaultValue: "Подписка" },
                            DESCRIPTION: { type: Scratch.ArgumentType.STRING, defaultValue: "Месячная подписка" },
                            PAYLOAD: { type: Scratch.ArgumentType.STRING, defaultValue: "payload_123" },
                            PROVIDER_TOKEN: { type: Scratch.ArgumentType.STRING, defaultValue: "PROVIDER_TOKEN" },
                            CURRENCY: { type: Scratch.ArgumentType.STRING, defaultValue: "XTR" },
                            PRICE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 100 },
                            IS_SUBSCRIPTION: { type: Scratch.ArgumentType.STRING, menu: "BOOLEAN_MENU" }
                        }
                    },
                    {
                        opcode: "sendPayment",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "отправить инвойс: [TITLE], [DESCRIPTION], payload [PAYLOAD], токен [PROVIDER_TOKEN], валюта [CURRENCY], цена [PRICE], подписка? [IS_SUBSCRIPTION] в чат [CHATID]",
                        arguments: {
                            TITLE: { type: Scratch.ArgumentType.STRING, defaultValue: "Покупка" },
                            DESCRIPTION: { type: Scratch.ArgumentType.STRING, defaultValue: "Описание покупки" },
                            PAYLOAD: { type: Scratch.ArgumentType.STRING, defaultValue: "payload_123" },
                            PROVIDER_TOKEN: { type: Scratch.ArgumentType.STRING, defaultValue: "PROVIDER_TOKEN" },
                            CURRENCY: { type: Scratch.ArgumentType.STRING, defaultValue: "XTR" },
                            PRICE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 100 },
                            IS_SUBSCRIPTION: { type: Scratch.ArgumentType.STRING, menu: "BOOLEAN_MENU" },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' },
                        },
                    },
                    {
                        opcode: "refundPayment",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "оформить возврат (Stars) для пользователя [USERID] с ID платежа [PAYMENT_ID]",
                        arguments: {
                            USERID: { type: Scratch.ArgumentType.STRING, defaultValue: "123456789" },
                            PAYMENT_ID: { type: Scratch.ArgumentType.STRING, defaultValue: "CHARGE_ID" }
                        }
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "Изменение прав пользователей"
                    },
                    {
                        opcode: "kickUser",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "кикнуть пользователя с ID [USERID] в чате [CHATID]",
                        arguments: {
                            USERID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 123456789 },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' }
                        }
                    },
                    {
                        opcode: "muteUser",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "замутить пользователя с ID [USERID] в чате [CHATID]",
                        arguments: {
                            USERID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 123456789 },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' }
                        }
                    },
                    {
                        opcode: "unmuteUser",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "размутить пользователя с ID [USERID] в чате [CHATID]",
                        arguments: {
                            USERID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 123456789 },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' }
                        }
                    },
                    {
                        opcode: "banUser",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "забанить пользователя с ID [USERID] в чате [CHATID]",
                        arguments: {
                            USERID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 123456789 },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' }
                        }
                    },
                    {
                        opcode: "unbanUser",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "разбанить пользователя с ID [USERID] в чате [CHATID]",
                        arguments: {
                            USERID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 123456789 },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' }
                        }
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "Реакции"
                    },
                    {
                        opcode: "setReaction",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "поставить реакцию [REACTION] на сообщение с ID [MESSAGEID] в чате [CHATID]",
                        arguments: {
                            REACTION: { type: Scratch.ArgumentType.STRING, defaultValue: '👍' },
                            MESSAGEID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' }
                        }
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "Массивы"
                    },
                    {
                        opcode: "addInlineButtonToInlineButtonsArray",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "добавить кнопку с текстом [TEXT] и типом [TYPE] с данными [DATA] в массив кнопок",
                        arguments: {
                            TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: "Кнопка 1" },
                            TYPE: { type: Scratch.ArgumentType.STRING, menu: "INLINE_BUTTONS_ARRAY_TYPE_MENU", },
                            DATA: { type: Scratch.ArgumentType.STRING, defaultValue: "data_1" }
                        }
                    },
                    {
                        opcode: "startNewLineOfInlineButtons",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "начать новую строку в массиве инлайн-кнопок"
                    },
                    {
                        opcode: "addPollAnswerToPollAnswersArray",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "добавить вариант ответа с текстом [TEXT] в массив вариантов ответа",
                        arguments: { TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: "Вариант 1" } }
                    },
                    {
                        opcode: "clearArray",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "очистить массив [CLEAR_ARRAY]",
                        arguments: { CLEAR_ARRAY: { type: Scratch.ArgumentType.STRING, menu: "CLEAR_ARRAY_MENU" } }
                    },
                    {
                        opcode: "getArray",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "массив [ARRAY]",
                        arguments: { ARRAY: { type: Scratch.ArgumentType.STRING, menu: "ARRAY_MENU" } }
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "Клавиатуры для ответа"
                    },
                    {
                        opcode: 'addReplyKeyboardButton',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'добавить кнопку с текстом [TEXT] в массив кнопок ответа',
                        arguments: {
                            TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: 'Кнопка' }
                        }
                    },
                    {
                        opcode: 'sendReplyKeyboard',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'отправить сообщение [TEXT] с клавиатурой [KEYBOARD_JSON] и настройками [ONE_TIME_KEYBOARD] [RESIZE_KEYBOARD] в чат [CHATID]',
                        arguments: {
                            TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: 'Выберите опцию:' },
                            KEYBOARD_JSON: { type: Scratch.ArgumentType.STRING, defaultValue: '[["Кнопка 1", "Кнопка 2"], ["Кнопка 3"]]' },
                            ONE_TIME_KEYBOARD: { type: Scratch.ArgumentType.STRING, menu: "ONE_TIME_KEYBOARD_MENU" },
                            RESIZE_KEYBOARD: { type: Scratch.ArgumentType.STRING, menu: "RESIZE_KEYBOARD_MENU" },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' }
                        }
                    },
                    {
                        opcode: 'removeReplyKeyboard',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'удалить клавиатуру ответа в чате [CHATID] с сообщением [TEXT]',
                        arguments: {
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' },
                            TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: 'Клавиатура удалена.' }
                        }
                    },
                    {
                        opcode: 'clearReplyKeyboardArray',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'очистить массив кнопок ответа',
                    },
                    {
                        opcode: 'getReplyKeyboardArray',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'массив кнопок ответа',
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "База данных"
                    },
                    {
                        opcode: "getDataBase",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "база данных"
                    },
                    {
                        opcode: "createDataBaseTable",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "создать таблицу в базе данных с названием [TABLENAME] и с параметрами [PARAMETERS]",
                        arguments: {
                            TABLENAME: { type: Scratch.ArgumentType.STRING, defaultValue: "User" },
                            PARAMETERS: { type: Scratch.ArgumentType.STRING, defaultValue: "tg_id, coins" },
                        }
                    },
                    {
                        opcode: "addDataBaseRecord",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "добавить запись в таблицу [TABLENAME] с параметрами [PARAMETERS] и значениями [VALUES]",
                        arguments: {
                            TABLENAME: { type: Scratch.ArgumentType.STRING, defaultValue: "User" },
                            PARAMETERS: { type: Scratch.ArgumentType.STRING, defaultValue: "tg_id, coins" },
                            VALUES: { type: Scratch.ArgumentType.STRING, defaultValue: "12345, 100" }
                        }
                    },
                    {
                        opcode: "updateDataBaseRecord",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "обновить запись в таблице [TABLENAME] где [KEY] равно [VALUE] с параметрами [PARAMETERS] и значениями [VALUES]",
                        arguments: {
                            TABLENAME: { type: Scratch.ArgumentType.STRING, defaultValue: "User" },
                            KEY: { type: Scratch.ArgumentType.STRING, defaultValue: "tg_id" },
                            VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: "12345" },
                            PARAMETERS: { type: Scratch.ArgumentType.STRING, defaultValue: "coins" },
                            VALUES: { type: Scratch.ArgumentType.STRING, defaultValue: "200" }
                        }
                    },
                    {
                        opcode: "deleteDataBaseRecord",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "удалить запись из таблицы [TABLENAME] где [KEY] равно [VALUE]",
                        arguments: {
                            TABLENAME: { type: Scratch.ArgumentType.STRING, defaultValue: "User" },
                            KEY: { type: Scratch.ArgumentType.STRING, defaultValue: "tg_id" },
                            VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: "12345" }
                        }
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "Получение обновлений"
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "Сообщения"
                    },
                    {
                        opcode: 'getMessage',
                        blockType: Scratch.BlockType.REPORTER,
                        text: "получить [GETMESSAGE_TYPE] последнего сообщения",
                        arguments: { GETMESSAGE_TYPE: { type: Scratch.ArgumentType.STRING, menu: "GETMESSAGE_TYPE_MENU" } }
                    },
                    {
                        opcode: 'isReply',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'последнее сообщение является ответом?'
                    },
                    {
                        opcode: 'getReplyToMessage',
                        blockType: Scratch.BlockType.REPORTER,
                        text: "получить [GETMESSAGE_TYPE] изначального сообщения (в ответе)",
                        arguments: { GETMESSAGE_TYPE: { type: Scratch.ArgumentType.STRING, menu: "GETMESSAGE_TYPE_MENU" } }
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "Коллбэки"
                    },
                    {
                        opcode: "getCallback",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "получить [GETCALLBACK_TYPE] коллбэка",
                        arguments: { GETCALLBACK_TYPE: { type: Scratch.ArgumentType.STRING, menu: "GETCALLBACK_TYPE_MENU" } }
                    },
                    {
                        opcode: "answerToCallback",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "ответить на коллбэк с ID [ID] с типом [TYPE] и текстом [TEXT]",
                        arguments: {
                            ID: { type: Scratch.ArgumentType.STRING, defaultValue: "callback_query_id_example" },
                            TYPE: { type: Scratch.ArgumentType.STRING, menu: "CALLBACK_ANSWER_TYPE_MENU", },
                            TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: "Привет!" }
                        }
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "Обработка платежей"
                    },
                    {
                        opcode: "whenPreCheckoutQueryReceived",
                        blockType: Scratch.BlockType.HAT,
                        text: "когда получен запрос pre_checkout_query"
                    },
                    {
                        opcode: "answerPreCheckoutQuery",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "ответить на запрос платежа с ID [PRE_CHECKOUT_QUERY_ID] как [OK] с ошибкой [ERROR_MESSAGE]",
                        arguments: {
                            PRE_CHECKOUT_QUERY_ID: { type: Scratch.ArgumentType.STRING, defaultValue: "pre_checkout_query_id_example" },
                            OK: { type: Scratch.ArgumentType.STRING, menu: "PRE_CHECKOUT_QUERY_OK_MENU" },
                            ERROR_MESSAGE: { type: Scratch.ArgumentType.STRING, defaultValue: "Платеж не может быть обработан" }
                        }
                    },
                    {
                        opcode: "getPreCheckoutQuery",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "получить [GETPRECHECKOUTQUERY_TYPE] из запроса платежа",
                        arguments: { GETPRECHECKOUTQUERY_TYPE: { type: Scratch.ArgumentType.STRING, menu: "GETPRECHECKOUTQUERY_TYPE_MENU" } }
                    },
                    {
                        opcode: "whenSuccessfulPayment",
                        blockType: Scratch.BlockType.HAT,
                        text: "когда получен успешный платеж"
                    },
                    {
                        opcode: "getSuccessfulPaymentInfo",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "получить [FIELD] из успешного платежа",
                        arguments: {
                            FIELD: {
                                type: Scratch.ArgumentType.STRING,
                                menu: "SUCCESSFUL_PAYMENT_FIELD_MENU"
                            }
                        }
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "Другое"
                    },
                    {
                        opcode: 'hasNewUpdates',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'есть новые обновления?'
                    },
                    {
                        opcode: 'isMessageStartsWith',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'последнее сообщение - начинается с [TEXT]?',
                        arguments: { TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: '/start' } }
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "Пользователи"
                    },
                    {
                        opcode: 'getAllUsers',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'получить всех пользователей'
                    },
                    {
                        opcode: 'getRecentUsers',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'получить последних пользователей'
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "Обновления"
                    },
                    {
                        opcode: "getRawUpdate",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "сырой JSON последнего обновления"
                    },
                    {
                        opcode: "getLastActionResult",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "сырой JSON ответа последнего действия"
                    },
                    {
                        opcode: "whenNewUpdate",
                        blockType: Scratch.BlockType.HAT,
                        text: "когда получено новое обновление"
                    },
                    {
                        opcode: 'clearUpdates',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'очистить обновления'
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "Отредактированные сообщения"
                    },
                    {
                        opcode: 'whenEditedMessage',
                        blockType: Scratch.BlockType.HAT,
                        text: 'когда отредактировано сообщение'
                    },
                    {
                        opcode: 'getEditedMessage',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'получить [GETEDITEDMESSAGE_TYPE] отредактированного сообщения',
                        arguments: { GETEDITEDMESSAGE_TYPE: { type: Scratch.ArgumentType.STRING, menu: "GETEDITEDMESSAGE_TYPE_MENU" } }
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "Инлайн-запросы"
                    },
                    {
                        opcode: 'whenInlineQuery',
                        blockType: Scratch.BlockType.HAT,
                        text: 'когда получен инлайн-запрос'
                    },
                    {
                        opcode: 'getInlineQuery',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'получить [GETINLINEQUERY_TYPE] инлайн-запроса',
                        arguments: { GETINLINEQUERY_TYPE: { type: Scratch.ArgumentType.STRING, menu: "GETINLINEQUERY_TYPE_MENU" } }
                    },
                    {
                        opcode: 'answerInlineQuery',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'ответить на инлайн-запрос с ID [QUERY_ID] с результатом [RESULT_JSON]',
                        arguments: {
                            QUERY_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'inline_query_id_example' },
                            RESULT_JSON: { type: Scratch.ArgumentType.STRING, defaultValue: '[{"type": "article", "id": "1", "title": "Пример", "input_message_content": {"message_text": "Привет от бота!"}}]' }
                        }
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "Статус бота в чатах"
                    },
                    {
                        opcode: 'whenMyChatMemberUpdated',
                        blockType: Scratch.BlockType.HAT,
                        text: 'когда изменен статус бота в чате'
                    },
                    {
                        opcode: 'getMyChatMemberUpdate',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'получить [GETMYCHATMEMBER_TYPE] об изменении статуса бота',
                        arguments: { GETMYCHATMEMBER_TYPE: { type: Scratch.ArgumentType.STRING, menu: "GETMYCHATMEMBER_TYPE_MENU" } }
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "Розыгрыши (Giveaways)"
                    },
                    {
                        opcode: "whenGiveawayCreated",
                        blockType: Scratch.BlockType.HAT,
                        text: "когда создан розыгрыш"
                    },
                    {
                        opcode: "whenGiveawayCompleted",
                        blockType: Scratch.BlockType.HAT,
                        text: "когда завершен розыгрыш"
                    },
                    {
                        opcode: 'getGiveawayCompletedInfo',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'получить [INFO_TYPE] из завершенного розыгрыша',
                        arguments: {
                            INFO_TYPE: { type: Scratch.ArgumentType.STRING, menu: "GIVEAWAY_COMPLETED_INFO_MENU" }
                        }
                    },
                    {
                        opcode: "whenGiveawayWinners",
                        blockType: Scratch.BlockType.HAT,
                        text: "когда определены победители розыгрыша"
                    },
                    {
                        opcode: 'getGiveawayWinnersInfo',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'получить [INFO_TYPE] из информации о победителях',
                        arguments: {
                            INFO_TYPE: { type: Scratch.ArgumentType.STRING, menu: "GIVEAWAY_WINNERS_INFO_MENU" }
                        }
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "Действия участников чата"
                    },
                    {
                        opcode: 'whenChatMemberUpdated',
                        blockType: Scratch.BlockType.HAT,
                        text: 'когда изменен статус участника чата'
                    },
                    {
                        opcode: 'getChatMemberUpdate',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'получить [GETCHATMEMBER_TYPE] об изменении статуса участника',
                        arguments: { GETCHATMEMBER_TYPE: { type: Scratch.ArgumentType.STRING, menu: "GETCHATMEMBER_TYPE_MENU" } }
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "Вход и выход пользователей"
                    },
                    {
                        opcode: 'whenUserJoins',
                        blockType: Scratch.BlockType.HAT,
                        text: 'когда пользователь вошел в чат'
                    },
                    {
                        opcode: 'getJoinedUserData',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'получить [DATA_TYPE] вошедшего пользователя',
                        arguments: {
                            DATA_TYPE: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'JOIN_LEAVE_USER_DATA_MENU'
                            }
                        }
                    },
                    {
                        opcode: 'whenUserLeaves',
                        blockType: Scratch.BlockType.HAT,
                        text: 'когда пользователь вышел из чата'
                    },
                    {
                        opcode: 'getLeftUserData',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'получить [DATA_TYPE] вышедшего пользователя',
                        arguments: {
                            DATA_TYPE: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'JOIN_LEAVE_USER_DATA_MENU'
                            }
                        }
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "Управление командами бота"
                    },
                    {
                        opcode: 'addBotCommand',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'добавить команду [COMMAND] с описанием [DESCRIPTION] в список команд',
                        arguments: {
                            COMMAND: { type: Scratch.ArgumentType.STRING, defaultValue: 'start' },
                            DESCRIPTION: { type: Scratch.ArgumentType.STRING, defaultValue: 'Начать взаимодействие' }
                        }
                    },
                    {
                        opcode: 'setMyCommands',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'установить команды бота из массива команд',
                    },
                    {
                        opcode: 'deleteMyCommands',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'удалить все команды бота',
                    },
                    {
                        opcode: 'clearBotCommandsArray',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'очистить массив команд бота',
                    },
                    {
                        opcode: 'getBotCommandsArray',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'массив команд бота',
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "Работа с файлами"
                    },
                    {
                        opcode: 'getFileInfo',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'получить [GETFILEINFO_TYPE] файла с ID [FILE_ID]',
                        arguments: {
                            FILE_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'file_id_example' },
                            GETFILEINFO_TYPE: { type: Scratch.ArgumentType.STRING, menu: "GETFILEINFO_TYPE_MENU" }
                        }
                    },
                    {
                        blockType: Scratch.BlockType.LABEL,
                        text: "Дополнительное управление чатом"
                    },
                    {
                        opcode: 'pinChatMessage',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'закрепить сообщение с ID [MESSAGEID] в чате [CHATID] без уведомления [DISABLE_NOTIFICATION]',
                        arguments: {
                            MESSAGEID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' },
                            DISABLE_NOTIFICATION: { type: Scratch.ArgumentType.STRING, menu: "BOOLEAN_MENU" }
                        }
                    },
                    {
                        opcode: 'unpinChatMessage',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'открепить сообщение с ID [MESSAGEID] в чате [CHATID]',
                        arguments: {
                            MESSAGEID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' }
                        }
                    },
                    {
                        opcode: 'leaveChat',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'выйти из чата [CHATID]',
                        arguments: {
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' }
                        }
                    },
                    {
                        opcode: 'getChatInfo',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'получить [GETCHATINFO_TYPE] чата [CHATID]',
                        arguments: {
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' },
                            GETCHATINFO_TYPE: { type: Scratch.ArgumentType.STRING, menu: "GETCHATINFO_TYPE_MENU" }
                        }
                    },
                    {
                        opcode: 'getChatAdministrators',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'получить администраторов чата [CHATID]',
                        arguments: {
                            CHATID: { type: Scratch.ArgumentType.STRING, defaultValue: 'ID или @юзернейм' }
                        }
                    },
                ],
                menus: {
                    PARSE_MODE_MENU: { acceptReporters: false, items: ["нет", "Markdown", "HTML"] },
                    INLINE_BUTTONS_ARRAY_TYPE_MENU: { acceptReporters: false, items: ["данные", "ссылка"] },
                    CALLBACK_ANSWER_TYPE_MENU: { acceptReporters: false, items: ["уведомление", "предупреждение"] },
                    GETMESSAGE_TYPE_MENU: {
                        acceptReporters: false,
                        items: [
                            "текст", "ID сообщения", "ID чата", "ID пользователя", "имя пользователя", "команду",
                            "значение кубика", "фото file_id", "аудио file_id", "документ file_id", "видео file_id",
                            "стикер file_id", "голосовое file_id", "видео-заметка file_id", "широта локации", "долгота локации"
                        ]
                    },
                    GETCALLBACK_TYPE_MENU: { acceptReporters: false, items: ["данные", "ID", "ID сообщения", "ID чата", "имя пользователя", "ID пользователя"] },
                    POLL_ISANONIM_MENU: { acceptReporters: false, items: ["анонимный", "не анонимный"] },
                    POLL_ALLOWSMULTIPLE_MENU: { acceptReporters: false, items: ["поддерживающий несколько ответов", "не поддерживающий несколько ответов"] },
                    REACTION_MENU: { acceptReporters: false, items: ["👍", "👎", "❤", "🔥", "🥰", "👏", "😁", "🤔", "🤯", "😱", "🤬", "😢", "🎉", "🤩", "🤮", "💩", "🙏", "👌", "🕊", "🤡", "🥱", "🥴", "😍", "🐳", "❤‍🔥", "🌚", "🌭", "💯", "🤣", "⚡", "🍌", "🏆", "💔", "🤨", "😐", "🍓", "🍾", "💋", "🖕", "😈", "😴", "😭", "🤓", "👻", "👨‍💻", "👀", "🎃", "🙈", "😇", "😨", "🤝", "✍", "🤗", "🫡", "🎅", "🎄", "☃", "💅", "🤪", "🗿", "🆒", "💘", "🙉", "🦄", "😘", "💊", "🙊", "😎", "👾", "🤷‍♂", "🤷", "🤷‍♀", "😡"] },
                    CLEAR_ARRAY_MENU: { acceptReporters: false, items: ["инлайн-кнопок", "вариантов ответа"] },
                    ARRAY_MENU: { acceptReporters: false, items: ["инлайн-кнопок", "вариантов ответа"] },
                    PRE_CHECKOUT_QUERY_OK_MENU: { acceptReporters: false, items: ["успешно", "не успешно"] },
                    GETPRECHECKOUTQUERY_TYPE_MENU: { acceptReporters: false, items: ["ID", "ID пользователя", "имя пользователя", "валюта", "сумма", "данные инвойса"] },
                    SUCCESSFUL_PAYMENT_FIELD_MENU: { acceptReporters: false, items: ["валюта", "сумма", "данные инвойса", "ID платежа Telegram", "ID платежа провайдера", "ID чата", "ID пользователя", "имя пользователя"] },
                    DICE_EMOJI_MENU: { acceptReporters: false, items: ["🎲", "🎯", "🏀", "⚽", "🎳", "🎰"] },
                    CHAT_ACTION_MENU: {
                        acceptReporters: false,
                        items: ["печатает", "отправляет фото", "отправляет видео", "отправляет документ", "записывает видео", "записывает голосовое", "отправляет геолокацию", "выбирает стикер"]
                    },
                    ONE_TIME_KEYBOARD_MENU: { acceptReporters: false, items: ["одноразовая", "постоянная"] },
                    RESIZE_KEYBOARD_MENU: { acceptReporters: false, items: ["авторазмер", "фиксированный размер"] },
                    GETEDITEDMESSAGE_TYPE_MENU: { acceptReporters: false, items: ["текст", "ID", "ID чата", "имя пользователя", "ID пользователя"] },
                    GETINLINEQUERY_TYPE_MENU: { acceptReporters: false, items: ["ID", "текст запроса", "ID пользователя", "имя пользователя"] },
                    GETMYCHATMEMBER_TYPE_MENU: { acceptReporters: false, items: ["ID чата", "название чата", "ID пользователя бота", "статус бота", "старый статус бота"] },
                    GETCHATMEMBER_TYPE_MENU: { acceptReporters: false, items: ["ID чата", "ID пользователя", "имя пользователя", "статус участника", "старый статус участника"] },
                    JOIN_LEAVE_USER_DATA_MENU: { acceptReporters: false, items: ["имя пользователя", "ID пользователя"] },
                    GETFILEINFO_TYPE_MENU: { acceptReporters: false, items: ["путь к файлу", "размер файла"] },
                    BOOLEAN_MENU: { acceptReporters: false, items: ["да", "нет"] },
                    GETCHATINFO_TYPE_MENU: { acceptReporters: false, items: ["название", "тип", "описание"] },
                    GIVEAWAY_COMPLETED_INFO_MENU: { acceptReporters: false, items: ["количество победителей", "количество невостребованных призов", "ID сообщения"] },
                    GIVEAWAY_WINNERS_INFO_MENU: { acceptReporters: false, items: ["ID чата", "ID сообщения", "дата выбора", "количество победителей", "ID победителей (список)", "количество невостребованных призов", "описание приза"] },
                }
            };
        }

        // --- МЕТОДЫ ---

        resetBot(args) {
            this.token = args.TOKEN;
            this.updates = [];
            this.offset = 0;
            this.allUsers = new Set();
            this.recentUsers = [];
            this.lastCommand = "";
            this.replyButtons = [];
            this.botCommands = [];
        }

        initBot(args) {
            this.pollingActive = false;
            return new Promise((resolve, _) => {
                const checkPoll = () => {
                    if (this.pollingRunning) {
                        setTimeout(checkPoll, 100);
                        return;
                    }
                    this.resetBot(args);
                    resolve();
                };
                checkPoll();
            });
        }

        startPolling(args) {
            if (!this.token || this.pollingActive || this.pollingRunning) return;
            const poll = () => {
                this.pollingRunning = true;
                const url = `https://api.telegram.org/bot${this.token}/getUpdates?offset=${this.offset}&allowed_updates=["message","callback_query","pre_checkout_query","edited_message","inline_query","my_chat_member","chat_member","giveaway_created","giveaway_winners","giveaway_completed"]`;
                fetch(url)
                    .then(response => {
                        if (!response.ok) throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
                        return response.json();
                    })
                    .then(data => {
                        if (data.ok && data.result.length > 0) {
                            this.updates = data.result;
                            this.offset = this.updates[this.updates.length - 1].update_id + 1;
                            this._updateUsers();
                        }
                        if (!this.pollingActive) {
                            this.pollingRunning = false;
                            return;
                        }
                        setTimeout(poll, args.SECONDS * 1000);
                    })
                    .catch(error => {
                        if (!this.pollingActive) {
                            this.pollingRunning = false;
                            return;
                        }
                        console.error('Ошибка поллинга:', error);
                        setTimeout(poll, args.SECONDS * 1000);
                    });
            };
            this.pollingActive = true;
            poll();
        }

        stopPolling() {
            this.pollingActive = false;
        }

        async _apiRequest(method, params) {
            if (!this.token) return;
            const url = `https://api.telegram.org/bot${this.token}/${method}`;
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(params)
                });
                const data = await response.json();

                // ДОБАВИТЬ ЭТУ СТРОКУ:
                this.lastActionResult = JSON.stringify(data);

                if (!data.ok) {
                    console.error(`Ошибка API (${method}):`, data.description);
                }
                return data;
            } catch (error) {
                console.error(`Ошибка сети (${method}):`, error);
                this.lastActionResult = JSON.stringify({ ok: false, description: error.toString() }); // И тут можно сохранить ошибку
            }
        }
        async sendMessage(args) {
            const body = { chat_id: args.CHATID, text: args.TEXT };
            if (args.PARSE_MODE !== "нет") body.parse_mode = args.PARSE_MODE;
            await this._apiRequest('sendMessage', body);
        }

        async sendMessageWithInlineButtons(args) {
            const body = { chat_id: args.CHATID, text: args.TEXT, reply_markup: { "inline_keyboard": JSON.parse(args.BUTTONS) } };
            if (args.PARSE_MODE !== "нет") body.parse_mode = args.PARSE_MODE;
            await this._apiRequest('sendMessage', body);
        }

        async answerToMessage(args) {
            const body = { chat_id: args.CHATID, text: args.TEXT, reply_to_message_id: args.MESSAGEID };
            if (args.PARSE_MODE !== "нет") body.parse_mode = args.PARSE_MODE;
            await this._apiRequest('sendMessage', body);
        }

        async answerToMessageWithInlineButtons(args) {
            const body = { chat_id: args.CHATID, text: args.TEXT, reply_to_message_id: args.MESSAGEID, reply_markup: { "inline_keyboard": JSON.parse(args.BUTTONS) } };
            if (args.PARSE_MODE !== "нет") body.parse_mode = args.PARSE_MODE;
            await this._apiRequest('sendMessage', body);
        }

        async sendChatAction(args) {
            let action = "typing";
            switch (args.ACTION) {
                case "печатает": action = "typing"; break;
                case "отправляет фото": action = "upload_photo"; break;
                case "отправляет видео": action = "upload_video"; break;
                case "отправляет документ": action = "upload_document"; break;
                case "записывает видео": action = "record_video"; break;
                case "записывает голосовое": action = "record_voice"; break;
                case "отправляет геолокацию": action = "find_location"; break;
                case "выбирает стикер": action = "choose_sticker"; break;
            }
            await this._apiRequest('sendChatAction', { chat_id: args.CHATID, action: action });
        }

        async sendPhoto(args) {
            const body = { chat_id: args.CHATID, caption: args.TEXT, photo: args.URL };
            if (args.PARSE_MODE !== "нет") body.parse_mode = args.PARSE_MODE;
            await this._apiRequest('sendPhoto', body);
        }

        async sendSticker(args) {
            await this._apiRequest('sendSticker', { chat_id: args.CHATID, sticker: args.STICKERID });
        }

        async sendAudio(args) {
            const body = { chat_id: args.CHATID, audio: args.URL_OR_ID, caption: args.CAPTION };
            if (args.PARSE_MODE !== "нет") body.parse_mode = args.PARSE_MODE;
            await this._apiRequest('sendAudio', body);
        }

        async sendDocument(args) {
            const body = { chat_id: args.CHATID, document: args.URL_OR_ID, caption: args.CAPTION };
            if (args.PARSE_MODE !== "нет") body.parse_mode = args.PARSE_MODE;
            await this._apiRequest('sendDocument', body);
        }

        async sendVideo(args) {
            const body = { chat_id: args.CHATID, video: args.URL_OR_ID, caption: args.CAPTION };
            if (args.PARSE_MODE !== "нет") body.parse_mode = args.PARSE_MODE;
            await this._apiRequest('sendVideo', body);
        }

        async sendVoice(args) {
            const body = { chat_id: args.CHATID, voice: args.URL_OR_ID, caption: args.CAPTION };
            if (args.PARSE_MODE !== "нет") body.parse_mode = args.PARSE_MODE;
            await this._apiRequest('sendVoice', body);
        }

        async sendVideoNote(args) {
            await this._apiRequest('sendVideoNote', { chat_id: args.CHATID, video_note: args.URL_OR_ID });
        }

        async sendMediaGroup(args) {
            try {
                await this._apiRequest('sendMediaGroup', { chat_id: args.CHATID, media: JSON.parse(args.MEDIA_ARRAY_JSON) });
            } catch (e) {
                console.error("Неверный формат JSON для медиа-группы:", e);
            }
        }

        async sendLocation(args) {
            await this._apiRequest('sendLocation', { chat_id: args.CHATID, latitude: args.LATITUDE, longitude: args.LONGITUDE });
        }

        async sendDice(args) {
            await this._apiRequest('sendDice', { chat_id: args.CHATID, emoji: args.EMOJI });
        }
        async sendGift(args) {
            const body = {
                chat_id: args.CHATID,
                gift_id: args.GIFT_ID
            };
            if (args.TEXT) body.text = args.TEXT;
            if (args.PARSE_MODE !== "нет") body.text_parse_mode = args.PARSE_MODE;

            await this._apiRequest('sendGift', body);
        }

        async getAvailableGifts() {
            const data = await this._apiRequest('getAvailableGifts', {});
            if (data && data.ok) {
                return JSON.stringify(data.result);
            }
            return "[]";
        }

        getRawUpdate() {
            // Берем последнее обновление из массива
            if (this.updates.length > 0) {
                return JSON.stringify(this.updates[this.updates.length - 1]);
            }
            return "{}";
        }

        getLastActionResult() {
            return this.lastActionResult;
        }
        async sendDiceAndGetValue(args) {
            const data = await this._apiRequest('sendDice', { chat_id: args.CHATID, emoji: args.EMOJI });
            if (data && data.ok) {
                return data.result.dice.value;
            }
            return ''; // Возвращаем пустое значение в случае ошибки
        }
        async sendPoll(args) {
            const body = {
                chat_id: args.CHATID,
                question: args.QUESTION,
                options: JSON.parse(args.OPTIONS),
                is_anonymous: args.ISANONIM === "анонимный",
                allows_multiple_answers: args.ALLOWSMULTIPLE === "поддерживающий несколько ответов"
            };
            await this._apiRequest('sendPoll', body);
        }

        async sendPayment(args) {
            const body = {
                chat_id: args.CHATID,
                title: args.TITLE,
                description: args.DESCRIPTION,
                payload: args.PAYLOAD || ("payment_payload_" + Date.now()),
                provider_token: args.PROVIDER_TOKEN,
                currency: args.CURRENCY,
                prices: [{ "label": `${args.TITLE}_price`, "amount": args.PRICE }]
            };
            if (args.IS_SUBSCRIPTION === "да") {
                body.subscription_period = 2592000;
            }
            await this._apiRequest('sendInvoice', body);
        }

        async createInvoiceLink(args) {
            const body = {
                title: args.TITLE,
                description: args.DESCRIPTION,
                payload: args.PAYLOAD,
                provider_token: args.PROVIDER_TOKEN,
                currency: args.CURRENCY,
                prices: [{ "label": `${args.TITLE}_price`, "amount": args.PRICE }]
            };
            if (args.IS_SUBSCRIPTION === "да") {
                body.subscription_period = 2592000;
            }
            const data = await this._apiRequest('createInvoiceLink', body);
            if (data && data.ok) {
                return data.result;
            }
            return '';
        }

        async refundPayment(args) {
            // Используем refundStarPayment, так как это единственный доступный метод API для возвратов (для Stars).
            // Для фиатных платежей возврат делается через панель провайдера.
            await this._apiRequest('refundStarPayment', { user_id: args.USERID, telegram_payment_charge_id: args.PAYMENT_ID });
        }

        async editMessageText(args) {
            await this._apiRequest('editMessageText', { chat_id: args.CHATID, message_id: args.MESSAGEID, text: args.TEXT });
        }

        async editMessageReplyMarkup(args) {
            try {
                const body = {
                    chat_id: args.CHATID,
                    message_id: args.MESSAGEID,
                    reply_markup: {
                        inline_keyboard: JSON.parse(args.BUTTONS)
                    }
                };
                await this._apiRequest('editMessageReplyMarkup', body);
            } catch (e) {
                console.error("Неверный формат JSON для кнопок:", e);
            }
        }

        async deleteMessage(args) {
            await this._apiRequest('deleteMessage', { chat_id: args.CHATID, message_id: args.MESSAGEID });
        }

        async kickUser(args) {
            await this._apiRequest('banChatMember', { chat_id: args.CHATID, user_id: args.USERID });
        }

        async muteUser(args) {
            await this._apiRequest('restrictChatMember', { chat_id: args.CHATID, user_id: args.USERID, permissions: { can_send_messages: false } });
        }

        async unmuteUser(args) {
            await this._apiRequest('restrictChatMember', {
                chat_id: args.CHATID,
                user_id: args.USERID,
                permissions: { can_send_messages: true, can_send_media_messages: true, can_send_polls: true, can_send_other_messages: true, can_add_web_page_previews: true, can_change_info: true, can_invite_users: true, can_pin_messages: true }
            });
        }

        async banUser(args) {
            await this._apiRequest('banChatMember', { chat_id: args.CHATID, user_id: args.USERID });
        }

        async unbanUser(args) {
            await this._apiRequest('unbanChatMember', { chat_id: args.CHATID, user_id: args.USERID, only_if_banned: true });
        }

        async setReaction(args) {
            const reactionPayload = [{ type: "emoji", emoji: args.REACTION }];
            await this._apiRequest('setMessageReaction', { chat_id: args.CHATID, message_id: args.MESSAGEID, reaction: reactionPayload });
        }

        async sendReplyKeyboard(args) {
            try {
                const body = {
                    chat_id: args.CHATID, text: args.TEXT,
                    reply_markup: {
                        keyboard: JSON.parse(args.KEYBOARD_JSON),
                        one_time_keyboard: args.ONE_TIME_KEYBOARD === "одноразовая",
                        resize_keyboard: args.RESIZE_KEYBOARD === "авторазмер"
                    }
                };
                await this._apiRequest('sendMessage', body);
            } catch (e) {
                console.error("Неверный формат JSON для клавиатуры ответа:", e);
            }
        }

        async removeReplyKeyboard(args) {
            await this._apiRequest('sendMessage', {
                chat_id: args.CHATID, text: args.TEXT,
                reply_markup: { remove_keyboard: true }
            });
        }

        async answerToCallback(args) {
            await this._apiRequest('answerCallbackQuery', {
                callback_query_id: args.ID,
                text: args.TEXT,
                show_alert: args.TYPE === "предупреждение"
            });
        }

        async answerPreCheckoutQuery(args) {
            const body = { pre_checkout_query_id: args.PRE_CHECKOUT_QUERY_ID, ok: args.OK === "успешно" };
            if (args.OK === "не успешно" && args.ERROR_MESSAGE) body.error_message = args.ERROR_MESSAGE;
            await this._apiRequest('answerPreCheckoutQuery', body);
        }

        async answerInlineQuery(args) {
            try {
                const results = JSON.parse(args.RESULT_JSON);
                await this._apiRequest('answerInlineQuery', { inline_query_id: args.QUERY_ID, results: results });
            } catch (e) {
                console.error("Неверный формат JSON для результатов инлайн-запроса:", e);
            }
        }

        async setMyCommands() {
            await this._apiRequest('setMyCommands', { commands: this.botCommands });
        }

        async deleteMyCommands() {
            await this._apiRequest('deleteMyCommands', {});
        }

        async pinChatMessage(args) {
            const body = {
                chat_id: args.CHATID, message_id: args.MESSAGEID,
                disable_notification: args.DISABLE_NOTIFICATION === "да"
            };
            await this._apiRequest('pinChatMessage', body);
        }

        async unpinChatMessage(args) {
            await this._apiRequest('unpinChatMessage', { chat_id: args.CHATID, message_id: args.MESSAGEID });
        }

        async leaveChat(args) {
            await this._apiRequest('leaveChat', { chat_id: args.CHATID });
        }

        async getChatInfo(args) {
            const data = await this._apiRequest('getChat', { chat_id: args.CHATID });
            if (data && data.ok) {
                switch (args.GETCHATINFO_TYPE) {
                    case "название": return data.result.title || '';
                    case "тип": return data.result.type || '';
                    case "описание": return data.result.description || '';
                }
            }
            return '';
        }

        async getChatAdministrators(args) {
            const data = await this._apiRequest('getChatAdministrators', { chat_id: args.CHATID });
            if (data && data.ok) {
                return data.result.map(admin => admin.user.username || admin.user.first_name || `ID: ${admin.user.id}`).join('; ');
            }
            return '';
        }

        async getFileInfo(args) {
            if (!args.FILE_ID) return '';
            const data = await this._apiRequest('getFile', { file_id: args.FILE_ID });
            if (data && data.ok) {
                switch (args.GETFILEINFO_TYPE) {
                    case "путь к файлу": return data.result.file_path ? `https://api.telegram.org/file/bot${this.token}/${data.result.file_path}` : '';
                    case "размер файла": return data.result.file_size ? String(data.result.file_size) : '';
                }
            }
            return '';
        }

        addInlineButtonToInlineButtonsArray(args) {
            if (this.inlineButtons.length === 0) this.inlineButtons.push([]);
            const lastRow = this.inlineButtons[this.inlineButtons.length - 1];
            if (args.TYPE === "данные") lastRow.push({ "text": args.TEXT, "callback_data": args.DATA });
            else if (args.TYPE === "ссылка") lastRow.push({ "text": args.TEXT, "url": args.DATA });
        }

        startNewLineOfInlineButtons() {
            this.inlineButtons.push([]);
        }

        addPollAnswerToPollAnswersArray(args) { this.pollAnswers.push(args.TEXT); }

        clearArray(args) {
            if (args.CLEAR_ARRAY == "инлайн-кнопок") this.inlineButtons = [[]];
            if (args.CLEAR_ARRAY == "вариантов ответа") this.pollAnswers = [];
        }

        getArray(args) {
            if (args.ARRAY == "инлайн-кнопок") {
                return JSON.stringify(this.inlineButtons.filter(row => row.length > 0));
            }
            if (args.ARRAY == "вариантов ответа") return JSON.stringify(this.pollAnswers);
            return "";
        }

        addReplyKeyboardButton(args) { this.replyButtons.push(args.TEXT); }
        clearReplyKeyboardArray() { this.replyButtons = []; }
        getReplyKeyboardArray() { return JSON.stringify(this.replyButtons); }

        addBotCommand(args) { this.botCommands.push({ command: args.COMMAND, description: args.DESCRIPTION }); }
        clearBotCommandsArray() { this.botCommands = []; }
        getBotCommandsArray() { return JSON.stringify(this.botCommands); }

        getDataBase() { return JSON.stringify(this.dataBase); }
        createDataBaseTable(args) { this.dataBase.push({ name: args.TABLENAME, parameters: args.PARAMETERS.split(',').map(p => p.trim()), objects: [] }); }
        addDataBaseRecord(args) {
            const table = this.dataBase.find(t => t.name === args.TABLENAME);
            if (table) {
                const values = args.VALUES.split(',').map(v => v.trim());
                const record = {};
                table.parameters.forEach((param, index) => { record[param] = values[index]; });
                table.objects.push(record);
            }
        }
        updateDataBaseRecord(args) {
            const table = this.dataBase.find(t => t.name === args.TABLENAME);
            if (table) {
                const record = table.objects.find(r => r[args.KEY] !== undefined && String(r[args.KEY]) === String(args.VALUE));
                if (record) {
                    const params = args.PARAMETERS.split(',').map(p => p.trim());
                    const values = args.VALUES.split(',').map(v => v.trim());
                    params.forEach((param, index) => { if (values[index] !== undefined) record[param] = values[index]; });
                }
            }
        }
        deleteDataBaseRecord(args) {
            const table = this.dataBase.find(t => t.name === args.TABLENAME);
            if (table) table.objects = table.objects.filter(r => r[args.KEY] === undefined || String(r[args.KEY]) !== String(args.VALUE));
        }

        _getUpdateField(extractor) {
            if (this.updates.length === 0) return null;
            const lastUpdate = this.updates[this.updates.length - 1];
            return extractor(lastUpdate) || null;
        }

        _getMessageData(message, type) {
            if (!message) return '';
            switch (type) {
                case "текст": return message.text || message.caption || '';
                case "ID сообщения": return String(message.message_id || '');
                case "ID чата": return String(message.chat?.id || '');
                case "имя пользователя": return message.from?.username || message.from?.first_name || "Неизвестный";
                case "ID пользователя": return String(message.from?.id || '');
                case "команду":
                    const text = message.text || "";
                    return text.startsWith("/") ? text.split(" ")[0] : '';
                case "значение кубика": return String(message.dice?.value || '');
                case "фото file_id": return message.photo?.[message.photo.length - 1]?.file_id || '';
                case "аудио file_id": return message.audio?.file_id || '';
                case "документ file_id": return message.document?.file_id || '';
                case "видео file_id": return message.video?.file_id || '';
                case "стикер file_id": return message.sticker?.file_id || '';
                case "голосовое file_id": return message.voice?.file_id || '';
                case "видео-заметка file_id": return message.video_note?.file_id || '';
                case "широта локации": return String(message.location?.latitude || '');
                case "долгота локации": return String(message.location?.longitude || '');
                default: return '';
            }
        }

        getMessage(args) {
            const message = this._getUpdateField(u => u.message);
            return this._getMessageData(message, args.GETMESSAGE_TYPE);
        }

        isReply() {
            const message = this._getUpdateField(u => u.message);
            return !!message?.reply_to_message;
        }

        getReplyToMessage(args) {
            const repliedMessage = this._getUpdateField(u => u.message?.reply_to_message);
            return this._getMessageData(repliedMessage, args.GETMESSAGE_TYPE);
        }

        getCallback(args) {
            const cb = this._getUpdateField(u => u.callback_query);
            if (!cb) return "";
            switch (args.GETCALLBACK_TYPE) {
                case "данные": return cb.data || "";
                case "ID": return String(cb.id) || "";
                case "ID сообщения": return String(cb.message?.message_id || "");
                case "ID чата": return String(cb.message?.chat?.id || "");
                case "имя пользователя": return cb.from?.username || cb.from?.first_name || "Неизвестный";
                case "ID пользователя": return String(cb.from?.id || "");
                default: return "";
            }
        }

        getPreCheckoutQuery(args) {
            const pcq = this._getUpdateField(u => u.pre_checkout_query);
            if (!pcq) return '';
            switch (args.GETPRECHECKOUTQUERY_TYPE) {
                case "ID": return pcq.id || "";
                case "ID пользователя": return String(pcq.from?.id || "");
                case "имя пользователя": return pcq.from?.username || pcq.from?.first_name || "Неизвестный";
                case "валюта": return pcq.currency || "";
                case "сумма": return String(pcq.total_amount || "");
                case "данные инвойса": return pcq.invoice_payload || "";
                default: return '';
            }
        }

        getSuccessfulPaymentInfo(args) {
            const payment = this._getUpdateField(u => u.message?.successful_payment);
            const message = this._getUpdateField(u => u.message);
            if (!payment || !message) return '';
            switch (args.FIELD) {
                case "валюта": return payment.currency || "";
                case "сумма": return String(payment.total_amount || "");
                case "данные инвойса": return payment.invoice_payload || "";
                case "ID платежа Telegram": return payment.telegram_payment_charge_id || "";
                case "ID платежа провайдера": return payment.provider_payment_charge_id || "";
                case "ID чата": return String(message.chat?.id || '');
                case "ID пользователя": return String(message.from?.id || '');
                case "имя пользователя": return message.from?.username || message.from?.first_name || "Неизвестный";
                default: return "";
            }
        }

        hasNewUpdates() {
            return this.updates.length > 0;
        }

        isMessageStartsWith(args) {
            const message = this._getUpdateField(u => u.message);
            const text = message?.text || message?.caption || "";
            return text.startsWith(args.TEXT);
        }

        getAllUsers() { return Array.from(this.allUsers).join('; '); }
        getRecentUsers() { return this.recentUsers.map(u => `${u.chatId ? u.chatId + ': ' : ''}${u.username} (ID: ${u.id})`).join('; '); }

        whenNewUpdate() { return this.updates.length > 0; }
        whenPreCheckoutQueryReceived() { return this.updates.some(u => u.pre_checkout_query); }
        whenSuccessfulPayment() { return this.updates.some(u => u.message?.successful_payment); }
        whenEditedMessage() { return this.updates.some(u => u.edited_message); }
        whenInlineQuery() { return this.updates.some(u => u.inline_query); }
        whenMyChatMemberUpdated() { return this.updates.some(u => u.my_chat_member); }
        whenChatMemberUpdated() { return this.updates.some(u => u.chat_member); }
        whenGiveawayCreated() { return this.updates.some(u => u.giveaway_created); }
        whenGiveawayCompleted() { return this.updates.some(u => u.giveaway_completed); }
        whenGiveawayWinners() { return this.updates.some(u => u.giveaway_winners); }
        whenUserJoins() { return this.updates.some(u => u.message?.new_chat_members?.length > 0); }
        whenUserLeaves() { return this.updates.some(u => u.message?.left_chat_member); }

        async clearUpdates() {
            return new Promise(resolve => { this.updates = []; resolve(); });
        }

        getEditedMessage(args) {
            const editedMessage = this.updates.slice().reverse().find(u => u.edited_message)?.edited_message;
            return this._getMessageData(editedMessage, args.GETEDITEDMESSAGE_TYPE);
        }

        getInlineQuery(args) {
            const iq = this.updates.slice().reverse().find(u => u.inline_query)?.inline_query;
            if (!iq) return '';
            switch (args.GETINLINEQUERY_TYPE) {
                case "ID": return iq.id || '';
                case "текст запроса": return iq.query || '';
                case "ID пользователя": return String(iq.from?.id || '');
                case "имя пользователя": return iq.from?.username || iq.from?.first_name || "Неизвестный";
                default: return '';
            }
        }

        _getChatMemberUpdate(field) {
            const update = this.updates.slice().reverse().find(u => u[field])?.[field];
            if (!update) return {};
            return {
                chatId: String(update.chat?.id || ''),
                chatTitle: update.chat?.title || '',
                userId: String(update.new_chat_member?.user?.id || ''),
                userName: update.new_chat_member?.user?.username || update.new_chat_member?.user?.first_name || 'Неизвестный',
                newStatus: update.new_chat_member?.status || '',
                oldStatus: update.old_chat_member?.status || ''
            };
        }

        getMyChatMemberUpdate(args) {
            const u = this._getChatMemberUpdate('my_chat_member');
            switch (args.GETMYCHATMEMBER_TYPE) {
                case "ID чата": return u.chatId;
                case "название чата": return u.chatTitle;
                case "ID пользователя бота": return u.userId;
                case "статус бота": return u.newStatus;
                case "старый статус бота": return u.oldStatus;
                default: return '';
            }
        }

        getChatMemberUpdate(args) {
            const u = this._getChatMemberUpdate('chat_member');
            switch (args.GETCHATMEMBER_TYPE) {
                case "ID чата": return u.chatId;
                case "ID пользователя": return u.userId;
                case "имя пользователя": return u.userName;
                case "статус участника": return u.newStatus;
                case "старый статус участника": return u.oldStatus;
                default: return '';
            }
        }

        getGiveawayCompletedInfo(args) {
            const info = this.updates.slice().reverse().find(u => u.giveaway_completed)?.giveaway_completed;
            if (!info) return '';
            switch (args.INFO_TYPE) {
                case "количество победителей": return info.winner_count;
                case "количество невостребованных призов": return info.unclaimed_prize_count;
                case "ID сообщения": return info.giveaway_message?.message_id;
                default: return '';
            }
        }

        getGiveawayWinnersInfo(args) {
            const info = this.updates.slice().reverse().find(u => u.giveaway_winners)?.giveaway_winners;
            if (!info) return '';
            switch (args.INFO_TYPE) {
                case "ID чата": return info.chat.id;
                case "ID сообщения": return info.giveaway_message_id;
                case "дата выбора": return info.winners_selection_date;
                case "количество победителей": return info.winner_count;
                case "ID победителей (список)": return info.winners.map(w => w.id).join(';');
                case "количество невостребованных призов": return info.unclaimed_prize_count || 0;
                case "описание приза": return info.prize_description || '';
                default: return '';
            }
        }

        _getJoinLeaveUserData(eventType, dataType) {
            const user = this.updates.slice().reverse().find(u => u.message?.[eventType])?.message?.[eventType];
            if (!user) return '';
            if (Array.isArray(user) && user.length > 0) { // Для new_chat_members
                switch (dataType) {
                    case "имя пользователя": return user[0].username || user[0].first_name || "Неизвестный";
                    case "ID пользователя": return String(user[0].id);
                }
            } else if (user) { // Для left_chat_member
                switch (dataType) {
                    case "имя пользователя": return user.username || user.first_name || "Неизвестный";
                    case "ID пользователя": return String(user.id);
                }
            }
            return '';
        }

        getJoinedUserData(args) { return this._getJoinLeaveUserData('new_chat_members', args.DATA_TYPE); }
        getLeftUserData(args) { return this._getJoinLeaveUserData('left_chat_member', args.DATA_TYPE); }

        _updateUsers() {
            this.updates.forEach(update => {
                const extractUserAndChat = (u) => {
                    if (u.message) return { from: u.message.from, chat: u.message.chat };
                    if (u.edited_message) return { from: u.edited_message.from, chat: u.edited_message.chat };
                    if (u.callback_query) return { from: u.callback_query.from, chat: u.callback_query.message?.chat };
                    if (u.inline_query) return { from: u.inline_query.from, chat: null };
                    if (u.pre_checkout_query) return { from: u.pre_checkout_query.from, chat: null };
                    if (u.chat_member) return { from: u.chat_member.from, chat: u.chat_member.chat };
                    if (u.my_chat_member) return { from: u.my_chat_member.from, chat: u.my_chat_member.chat };
                    return { from: null, chat: null };
                };

                const { from: fromUser, chat: chatInfo } = extractUserAndChat(update);

                if (fromUser) {
                    const userId = String(fromUser.id);
                    if (!this.allUsers.has(userId)) this.allUsers.add(userId);

                    const existingRecentUserIndex = this.recentUsers.findIndex(u => u.id === userId);
                    if (existingRecentUserIndex !== -1) this.recentUsers.splice(existingRecentUserIndex, 1);

                    this.recentUsers.push({
                        id: userId,
                        username: fromUser.username || fromUser.first_name || "Неизвестный",
                        chatId: chatInfo ? String(chatInfo.id) : null
                    });

                    if (this.recentUsers.length > this.maxRecentUsers) this.recentUsers.shift();
                }

                if (update.giveaway_winners?.winners) {
                    const giveawayChatId = String(update.giveaway_winners.chat.id);
                    update.giveaway_winners.winners.forEach(winnerUser => {
                        const userId = String(winnerUser.id);
                        if (!this.allUsers.has(userId) && this.recentUsers.findIndex(u => u.id === userId) === -1) {
                            this.recentUsers.push({ id: userId, username: winnerUser.username || winnerUser.first_name || "Неизвестный", chatId: giveawayChatId });
                            if (this.recentUsers.length > this.maxRecentUsers) this.recentUsers.shift();
                        }
                    });
                }
            });
        }
    }

    Scratch.extensions.register(new TelegramBotAPIExtension());

})(Scratch);
