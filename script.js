<<<<<<< HEAD
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const toggleSidebarBtn = document.getElementById("toggle-sidebar");
const sidebar = document.getElementById("sidebar");
const recentChatsList = document.getElementById("recent-chats");

const greetings = ["hi", "hello", "hey"];
const creatorQs = ["who created you", "who is your creator"];

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyB2mId-X_ScfyAEv6lDYd_WgsiFAaJsBv8";

// Helper: Add chat message
function addMessage(text, sender, animated = false) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);

  if (animated) {
    msg.classList.add("typing");
    chatBox.appendChild(msg);
    let i = 0;

    function typeChar() {
      if (i < text.length) {
        const char = text.charAt(i++);
        msg.innerHTML += char === '\n' ? "<br>" : char;
        chatBox.scrollTop = chatBox.scrollHeight;
        setTimeout(typeChar, 20);
      } else {
        // Render **bold** markdown
        msg.innerHTML = msg.innerHTML.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        msg.classList.remove("typing");
      }
    }
    typeChar();
  } else {
    msg.innerHTML = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

// Handle user input
async function handleUserMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  userInput.value = "";
  saveRecentChat(text);

  const lowerText = text.toLowerCase();

  if (greetings.includes(lowerText)) {
    addMessage("Hello! How can I assist you with airport-related info today?", "bot", true);
    return;
  }

  if (creatorQs.some(q => lowerText.includes(q))) {
    addMessage("I was created by a developer to help answer questions about airports ✈️", "bot", true);
    return;
  }

  const isAirportRelated = /\b(airport|flight|terminal|airline|IATA|code|departure|arrival|baggage|check-in|boarding)\b/i.test(text);

  if (isAirportRelated) {
    addMessage("Let me check that for you...", "bot");
    const reply = await fetchGeminiResponse(text);
    addMessage(reply, "bot", true);
  } else {
    addMessage("I can only help with questions related to **airports**. Try asking about airport codes, locations, terminals, etc.", "bot", true);
  }
}

// Save to recent chats
function saveRecentChat(text) {
  const item = document.createElement("li");
  item.textContent = text;
  item.onclick = () => {
    userInput.value = text;
    handleUserMessage();
  };
  recentChatsList.prepend(item);
}

// Fetch Gemini response
async function fetchGeminiResponse(prompt) {
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't find the information.";
    return text;
  } catch (error) {
    return "Oops! Something went wrong while contacting the Gemini API.";
  }
}

// Toggle sidebar visibility
// toggleSidebarBtn.addEventListener("click", () => {
//   sidebar.classList.toggle("hidden");
//   chatBox.classList.toggle("expanded");
// });

toggleSidebarBtn.addEventListener("click", () => {
  sidebar.classList.toggle("hidden");
  document.getElementById("chat-container").classList.toggle("expanded");
});


sendBtn.addEventListener("click", handleUserMessage);
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleUserMessage();
});
=======
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const toggleSidebarBtn = document.getElementById("toggle-sidebar");
const sidebar = document.getElementById("sidebar");
const recentChatsList = document.getElementById("recent-chats");

const greetings = ["hi", "hello", "hey"];
const creatorQs = ["who created you", "who is your creator"];

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyB2mId-X_ScfyAEv6lDYd_WgsiFAaJsBv8";

// Helper: Add chat message
function addMessage(text, sender, animated = false) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);

  if (animated) {
    msg.classList.add("typing");
    chatBox.appendChild(msg);
    let i = 0;

    function typeChar() {
      if (i < text.length) {
        const char = text.charAt(i++);
        msg.innerHTML += char === '\n' ? "<br>" : char;
        chatBox.scrollTop = chatBox.scrollHeight;
        setTimeout(typeChar, 20);
      } else {
        // Render **bold** markdown
        msg.innerHTML = msg.innerHTML.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        msg.classList.remove("typing");
      }
    }
    typeChar();
  } else {
    msg.innerHTML = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

// Handle user input
async function handleUserMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  userInput.value = "";
  saveRecentChat(text);

  const lowerText = text.toLowerCase();

  if (greetings.includes(lowerText)) {
    addMessage("Hello! How can I assist you with airport-related info today?", "bot", true);
    return;
  }

  if (creatorQs.some(q => lowerText.includes(q))) {
    addMessage("I was created by a developer to help answer questions about airports ✈️", "bot", true);
    return;
  }

  const isAirportRelated = /\b(airport|flight|terminal|airline|IATA|code|departure|arrival|baggage|check-in|boarding)\b/i.test(text);

  if (isAirportRelated) {
    addMessage("Let me check that for you...", "bot");
    const reply = await fetchGeminiResponse(text);
    addMessage(reply, "bot", true);
  } else {
    addMessage("I can only help with questions related to **airports**. Try asking about airport codes, locations, terminals, etc.", "bot", true);
  }
}

// Save to recent chats
function saveRecentChat(text) {
  const item = document.createElement("li");
  item.textContent = text;
  item.onclick = () => {
    userInput.value = text;
    handleUserMessage();
  };
  recentChatsList.prepend(item);
}

// Fetch Gemini response
async function fetchGeminiResponse(prompt) {
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't find the information.";
    return text;
  } catch (error) {
    return "Oops! Something went wrong while contacting the Gemini API.";
  }
}

// Toggle sidebar visibility
// toggleSidebarBtn.addEventListener("click", () => {
//   sidebar.classList.toggle("hidden");
//   chatBox.classList.toggle("expanded");
// });

toggleSidebarBtn.addEventListener("click", () => {
  sidebar.classList.toggle("hidden");
  document.getElementById("chat-container").classList.toggle("expanded");
});


sendBtn.addEventListener("click", handleUserMessage);
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleUserMessage();
});
>>>>>>> c88e6fe (initial commit)
