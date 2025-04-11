const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const toggleSidebarBtn = document.getElementById("toggle-sidebar");
const sidebar = document.getElementById("sidebar");
const recentChatsList = document.getElementById("recent-chats");
const chatContainer = document.getElementById("chat-container");

// Add a variable to track if generation is in progress
let isGenerating = false;
let shouldStopGeneration = false;

const greetings = ["hi", "hello", "hey"];
const creatorQs = ["who created you", "who is your creator"];

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyB2mId-X_ScfyAEv6lDYd_WgsiFAaJsBv8";

// Create stop button and add to input area
const stopBtn = document.createElement("button");
stopBtn.id = "stop-btn";
stopBtn.title = "Stop Generation";
stopBtn.className = "icon-button";
stopBtn.innerHTML = "✕";
document.querySelector(".input-wrapper").appendChild(stopBtn);

// Helper: Add chat message
function addMessage(text, sender, animated = false) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);

  if (animated && !shouldStopGeneration) {
    isGenerating = true;
    toggleInputState(true);
    
    msg.classList.add("typing");
    chatBox.appendChild(msg);
    let i = 0;

    function typeChar() {
      if (i < text.length && !shouldStopGeneration) {
        const char = text.charAt(i++);
        msg.innerHTML += char === '\n' ? "<br>" : char;
        chatBox.scrollTop = chatBox.scrollHeight;
        setTimeout(typeChar, 20);
      } else {
        // Render **bold** markdown
        msg.innerHTML = msg.innerHTML.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        msg.classList.remove("typing");
        isGenerating = false;
        shouldStopGeneration = false;
        toggleInputState(false);
      }
    }
    typeChar();
  } else {
    msg.innerHTML = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

// Toggle input state during generation
function toggleInputState(disabled) {
  userInput.disabled = disabled;
  sendBtn.style.display = disabled ? "none" : "flex";
  stopBtn.style.display = disabled ? "flex" : "none";
}

// Handle stopping generation
stopBtn.addEventListener("click", () => {
  if (isGenerating) {
    shouldStopGeneration = true;
    isGenerating = false;
    toggleInputState(false);
    
    // Add a message to indicate generation was stopped
    const lastMessage = chatBox.lastElementChild;
    if (lastMessage && lastMessage.classList.contains("bot") && lastMessage.classList.contains("typing")) {
      lastMessage.innerHTML += "<br><em>(Generation stopped)</em>";
      lastMessage.classList.remove("typing");
    }
  }
});

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
    addMessage("I was created by a mosquito to help answer questions about airports ✈️", "bot", true);
    return;
  }

  // Detect flight route queries like "flights from Delhi to Mumbai"
const routeRegex = /flights?\s+from\s+([\w\s]+)\s+to\s+([\w\s]+)/i;
const routeMatch = text.match(routeRegex);
if (routeMatch) {
  const source = routeMatch[1].trim();
  const destination = routeMatch[2].trim();
  addMessage(`Searching flights from **${source}** to **${destination}**...`, "bot");

  const reply = await fetchGeminiResponse(
    `List available flights or airlines from ${source} to ${destination}. Only include real airports and valid airlines.`
  );
  addMessage(reply, "bot", true);
  return;
}

  const isAirportRelated = /\b(airport|flight|terminal|airline|IATA|code|departure|arrival|baggage|check-in|boarding)\b/i.test(text);

  if (!isAirportRelated) {
    addMessage("I specialize in **airport-related** topics only. I can't help with programming, math, or unrelated questions.", "bot", true);
    return;
  }
  
  addMessage("Let me check that for you...", "bot");
  const reply = await fetchGeminiResponse(text);
  addMessage(reply, "bot", true);
  
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
  
  // Keep only the 10 most recent chats
  while (recentChatsList.children.length > 10) {
    recentChatsList.removeChild(recentChatsList.lastChild);
  }
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
toggleSidebarBtn.addEventListener("click", () => {
  sidebar.classList.toggle("hidden");
  
  // Force a layout recalculation
  setTimeout(() => {
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 300);
});

sendBtn.addEventListener("click", handleUserMessage);
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleUserMessage();
});

// Add initial welcome message when page loads
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    addMessage("Welcome! I'm AirportBot. Ask me anything about airports, flights, terminals, or travel information.", "bot", true);
  }, 500);
});