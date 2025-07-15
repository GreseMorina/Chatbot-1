const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessage = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = fileUploadWrapper.querySelector("#file-cancel");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");


// OpenRouter API Setup
const API_KEY = "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";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-3.5-turbo";

// User Data + Chat History
const userData = {
  message: null,
  file: { data: null, mime_type: null }
};
const chatHistory = [];

// Helper: Create message div
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Send message to OpenRouter
const generateBotResponse = async (incomingMessageDiv) => {
  const messageElement = incomingMessageDiv.querySelector(".message-text");

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      "HTTP-Referer": "https://www.rohde-schwarz.com/de", 
      "X-Title": "Rohde-Schwarz-Chatbot"
    },
    body: JSON.stringify({
      model: MODEL,
      messages: chatHistory,
      temperature: 0.7
    })
  };

  try {
    const response = await fetch(API_URL, requestOptions);
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || "Unbekannter Fehler");

    const reply = data.choices[0].message.content;
    messageElement.innerText = reply;
    chatHistory.push({ role: "assistant", content: reply });
  } catch (error) {
    messageElement.innerText = "❌ " + error.message;
    messageElement.style.color = "#ff0000";
  } finally {
    incomingMessageDiv.classList.remove("thinking");
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  }
};

// Send user message
const handleOutgoingMessage = (e) => {
  e.preventDefault();
  userData.message = messageInput.value.trim();
  if (!userData.message) return;

  const messageText = userData.message;
  messageInput.value = "";
  messageInput.dispatchEvent(new Event("input"));
  fileUploadWrapper.classList.remove("file-uploaded");

  chatHistory.push({ role: "user", content: messageText });

  const filePreview = userData.file.data
    ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />`
    : "";

  const outgoingDiv = createMessageElement(
    `<div class="message-text"></div>${filePreview}`, "user-message"
  );
  outgoingDiv.querySelector(".message-text").innerText = messageText;
  chatBody.appendChild(outgoingDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

  setTimeout(() => {
    const incomingDiv = createMessageElement(`
      <img class="bot-avatar" src="assets/img/1.avif" alt="Bot" width="50" height="50">
      <div class="message-text">
        <div class="thinking-indicator">
          <div class="dot"></div><div class="dot"></div><div class="dot"></div>
        </div>
      </div>`, "bot-message", "thinking");
    chatBody.appendChild(incomingDiv);
    generateBotResponse(incomingDiv);
  }, 600);

  userData.file = {};
};

// Emoji picker
const picker = new EmojiMart.Picker({
  theme: "light",
  skinTonePosition: "none",
  previewPosition: "none",
  onEmojiSelect: (emoji) => {
    const { selectionStart: start, selectionEnd: end } = messageInput;
    messageInput.setRangeText(emoji.native, start, end, "end");
    messageInput.focus();
  },
  onClickOutside: (e) => {
    if (e.target.id === "emoji-picker") {
      document.body.classList.toggle("show-emoji-picker");
    } else {
      document.body.classList.remove("show-emoji-picker");
    }
  },
});
document.querySelector(".chat-form").appendChild(picker);

// File upload
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    fileInput.value = "";
    fileUploadWrapper.querySelector("img").src = e.target.result;
    fileUploadWrapper.classList.add("file-uploaded");

    const base64 = e.target.result.split(",")[1];
    userData.file = {
      data: base64,
      mime_type: file.type
    };
  };
  reader.readAsDataURL(file);
});

fileCancelButton.addEventListener("click", () => {
  userData.file = {};
  fileUploadWrapper.classList.remove("file-uploaded");
});

// Dynamische Texthöhe
const initialInputHeight = messageInput.scrollHeight;
messageInput.addEventListener("input", () => {
  messageInput.style.height = `${initialInputHeight}px`;
  messageInput.style.height = `${messageInput.scrollHeight}px`;
  document.querySelector(".chat-form").style.borderRadius =
    messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
});

// Enter-Taste zum Senden
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && messageInput.value.trim()) {
    e.preventDefault();
    handleOutgoingMessage(e);
  }
});

// Button-Handler
sendMessage.addEventListener("click", (e) => handleOutgoingMessage(e));
document.querySelector("#file-upload").addEventListener("click", () => fileInput.click());
closeChatbot.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));


