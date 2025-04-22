const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const toggleSidebarBtn = document.getElementById("toggle-sidebar");
const sidebar = document.getElementById("sidebar");
const recentChatsList = document.getElementById("recent-chats");
const chatContainer = document.getElementById("chat-container");

// API Keys and URLs
const AVIATION_STACK_API_KEY = "bf383069df64c851ae1fbb0e0f0e7e1e";
const AVIATION_STACK_API_URL = "http://api.aviationstack.com/v1";

let isGenerating = false;
let shouldStopGeneration = false;

const greetings = ["hi", "hello", "hey"];
const creatorQs = ["who created you", "who is your creator"];

const stopBtn = document.createElement("button");
stopBtn.id = "stop-btn";
stopBtn.title = "Stop Generation";
stopBtn.className = "icon-button";
stopBtn.innerHTML = "✕";
document.querySelector(".input-wrapper").appendChild(stopBtn);

// Add chat message
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

// Stop button event
stopBtn.addEventListener("click", () => {
  if (isGenerating) {
    shouldStopGeneration = true;
    isGenerating = false;
    toggleInputState(false);
    const lastMessage = chatBox.lastElementChild;
    if (lastMessage && lastMessage.classList.contains("bot") && lastMessage.classList.contains("typing")) {
      lastMessage.innerHTML += "<br><em>(Generation stopped)</em>";
      lastMessage.classList.remove("typing");
    }
  }
});

// Handle user message
async function handleUserMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  userInput.value = "";
  saveRecentChat(text);

  const lowerText = text.toLowerCase();

  // Handle greetings
  if (greetings.includes(lowerText)) {
    addMessage("Hello! How can I assist you with airport-related info today?", "bot", true);
    return;
  }

  // Handle creator questions
  if (creatorQs.some(q => lowerText.includes(q))) {
    addMessage("I was created by Walter White and his team to help answer questions about airports ✈️", "bot", true);
    return;
  }

  // Check for flight status query (e.g., "flight status of AI 302" or "status of flight AI302")
  const flightStatusRegex = /(?:flight status|status)\s+(?:of flight|for flight|of|for)?\s*([A-Z]{1,3})\s*(\d{1,4})/i;
  const flightStatusMatch = text.match(flightStatusRegex);
  
  if (flightStatusMatch) {
    const airline = flightStatusMatch[1].trim();
    const flightNumber = flightStatusMatch[2].trim();
    const fullFlightNumber = `${airline}${flightNumber}`;
    
    addMessage(`Checking status for flight **${airline} ${flightNumber}**...`, "bot");
    const statusData = await fetchFlightStatus(airline, flightNumber);
    addMessage(statusData, "bot", true);
    return;
  }

  // Check for direct flight number query (e.g., "AI 302" or "AI302")
  const directFlightRegex = /^\s*([A-Z]{1,3})\s*(\d{1,4})\s*$/i;
  const directFlightMatch = text.match(directFlightRegex);
  
  if (directFlightMatch) {
    const airline = directFlightMatch[1].trim();
    const flightNumber = directFlightMatch[2].trim();
    
    addMessage(`Checking status for flight **${airline} ${flightNumber}**...`, "bot");
    const statusData = await fetchFlightStatus(airline, flightNumber);
    addMessage(statusData, "bot", true);
    return;
  }

  // Flight-related query (departures/arrivals)
  const flightQueryRegex = /(departures?|arrivals?)\s+from\s+([\w\s]+)\s+airport/i;
  const flightQueryMatch = text.match(flightQueryRegex);

  if (flightQueryMatch) {
    const direction = flightQueryMatch[1].toLowerCase(); // departures or arrivals
    const airportName = flightQueryMatch[2].trim();

    addMessage(`Fetching ${direction} from **${airportName}**...`, "bot");

    const flightsData = await fetchFlightsForAirport(airportName, direction);
    addMessage(flightsData, "bot", true);
    return;
  }

  // Airport information query
  const airportInfoRegex = /information\s+(?:about|on|for)\s+([\w\s]+)\s+airport/i;
  const airportInfoMatch = text.match(airportInfoRegex);
  
  if (airportInfoMatch) {
    const airportName = airportInfoMatch[1].trim();
    addMessage(`Looking up information for **${airportName} Airport**...`, "bot");
    const airportData = await fetchAirportInfo(airportName);
    addMessage(airportData, "bot", true);
    return;
  }

  // Other airport-related queries
  const isAirportRelated = /\b(airport|flight|flights|terminal|terminals|airline|IATA|departure|arrival|baggage|check-in|boarding)\b/i.test(text);

  if (!isAirportRelated) {
    addMessage("I specialize in **airport-related** topics only. I can't help with programming, math, or unrelated questions.", "bot", true);
    return;
  }

  addMessage("Let me check that for you...", "bot");
  const reply = await fetchGeminiResponse(text);
  addMessage(reply, "bot", true);
}

// Fetch flight status using AviationStack API
async function fetchFlightStatus(airline, flightNumber) {
  try {
    // Clean up flight number format and combine
    const cleanAirline = airline.trim().toUpperCase();
    const cleanNumber = flightNumber.trim();
    
    const response = await fetch(`${AVIATION_STACK_API_URL}/flights?access_key=${AVIATION_STACK_API_KEY}&flight_iata=${cleanAirline}${cleanNumber}`);
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      const flight = data.data[0];
      
      const departureTime = new Date(flight.departure.scheduled).toLocaleString();
      const arrivalTime = new Date(flight.arrival.scheduled).toLocaleString();
      const status = flight.flight_status.charAt(0).toUpperCase() + flight.flight_status.slice(1);
      
      let statusInfo = `Flight Status for **${cleanAirline} ${cleanNumber}**:\n\n`;
      statusInfo += `Status: **${status}**\n`;
      statusInfo += `Airline: ${flight.airline.name}\n`;
      statusInfo += `From: ${flight.departure.airport} (${flight.departure.iata})\n`;
      statusInfo += `To: ${flight.arrival.airport} (${flight.arrival.iata})\n`;
      statusInfo += `Scheduled Departure: ${departureTime}\n`;
      statusInfo += `Scheduled Arrival: ${arrivalTime}\n`;
      
      if (flight.departure.delay) {
        statusInfo += `Departure Delay: ${flight.departure.delay} minutes\n`;
      }
      
      if (flight.arrival.delay) {
        statusInfo += `Arrival Delay: ${flight.arrival.delay} minutes\n`;
      }
      
      if (flight.departure.terminal) {
        statusInfo += `Departure Terminal: ${flight.departure.terminal}\n`;
      }
      
      if (flight.departure.gate) {
        statusInfo += `Departure Gate: ${flight.departure.gate}\n`;
      }
      
      return statusInfo;
    } else {
      return `Sorry, I couldn't find status information for flight **${cleanAirline} ${cleanNumber}**.`;
    }
  } catch (error) {
    console.error("Flight status error:", error);
    return "Oops! Something went wrong while fetching flight status information.";
  }
}

// Fetch flights for airport (departures/arrivals)
async function fetchFlightsForAirport(airportName, direction) {
  try {
    // First try to get the IATA code for the airport
    const airportCode = await getAirportIATACode(airportName);
    if (!airportCode) {
      return `Sorry, I couldn't find the IATA code for **${airportName} Airport**.`;
    }
    
    // Now fetch flights based on direction
    const isArrival = direction.toLowerCase().startsWith('arrival');
    const param = isArrival ? 'arr_iata' : 'dep_iata';
    
    const response = await fetch(`${AVIATION_STACK_API_URL}/flights?access_key=${AVIATION_STACK_API_KEY}&${param}=${airportCode}`);
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      const directionTitle = isArrival ? "Arrivals" : "Departures";
      let flightList = `**${directionTitle}** for ${airportName} Airport (${airportCode}):\n\n`;
      
      // Limit to first 5 flights to avoid too much text
      const flights = data.data.slice(0, 5);
      
      flights.forEach(flight => {
        const flightTime = isArrival ? 
          new Date(flight.arrival.scheduled).toLocaleString() : 
          new Date(flight.departure.scheduled).toLocaleString();
        
        const otherAirport = isArrival ? 
          `${flight.departure.airport} (${flight.departure.iata})` : 
          `${flight.arrival.airport} (${flight.arrival.iata})`;
        
        flightList += `**${flight.airline.iata} ${flight.flight.number}**\n`;
        flightList += `${isArrival ? "From" : "To"}: ${otherAirport}\n`;
        flightList += `Scheduled ${isArrival ? "Arrival" : "Departure"}: ${flightTime}\n`;
        flightList += `Status: ${flight.flight_status}\n\n`;
      });
      
      flightList += `Showing ${flights.length} of ${data.data.length} total flights.`;
      return flightList;
    } else {
      return `No ${direction} found for **${airportName} Airport**.`;
    }
  } catch (error) {
    console.error("Airport flights error:", error);
    return `Oops! Something went wrong while fetching ${direction} for ${airportName}.`;
  }
}

// Get airport IATA code
async function getAirportIATACode(airportName) {
  try {
    // This would typically call an API to get the IATA code from a name
    // For now, we'll use a simplistic approach with common airports
    const commonAirports = {
      "jfk": "JFK",
      "john f kennedy": "JFK",
      "lax": "LAX",
      "los angeles": "LAX",
      "heathrow": "LHR",
      "london heathrow": "LHR",
      "delhi": "DEL",
      "indira gandhi": "DEL",
      "mumbai": "BOM",
      "chhatrapati shivaji": "BOM",
      "o'hare": "ORD",
      "chicago": "ORD",
    };
    
    const normalizedName = airportName.toLowerCase().trim();
    
    // Try to match with common airports
    for (const [key, code] of Object.entries(commonAirports)) {
      if (normalizedName.includes(key)) {
        return code;
      }
    }
    
    // If not found in common airports, you could call an API here
    // For demo purposes, we'll just return something that looks like the input
    // In a real implementation, you would use an airport database API
    const nameWords = normalizedName.split(' ');
    if (nameWords.length >= 1) {
      // Generate a plausible 3-letter code from the first letters
      const firstLetters = nameWords.slice(0, 3).map(word => word.charAt(0).toUpperCase()).join('');
      if (firstLetters.length === 3) {
        return firstLetters;
      } else if (nameWords[0].length >= 3) {
        // Or use first 3 letters of first word if it's long enough
        return nameWords[0].slice(0, 3).toUpperCase();
      }
    }
    
    return null;
  } catch (error) {
    console.error("Airport code lookup error:", error);
    return null;
  }
}

// Fetch airport information
async function fetchAirportInfo(airportName) {
  try {
    const airportCode = await getAirportIATACode(airportName);
    if (!airportCode) {
      return `Sorry, I couldn't find information for **${airportName} Airport**.`;
    }
    
    // For a full implementation, you would need to call an airport database API
    // For demo purposes, we'll return placeholder information
    return `
**${airportName.toUpperCase()} Airport (${airportCode})**

**Location**: ${generatePlaceholderLocation(airportName)}
**Terminals**: ${Math.floor(Math.random() * 5) + 1}
**Airlines**: Major international and domestic carriers
**Services**: Restaurants, shops, lounges, WiFi
**Transport**: Taxis, buses, car rental, subway/train connections

For real-time information including delays, please check the official ${airportName} Airport website.
`;
  } catch (error) {
    console.error("Airport info error:", error);
    return `Sorry, I couldn't fetch information for ${airportName} Airport.`;
  }
}

// Generate placeholder location for demo purposes
function generatePlaceholderLocation(airportName) {
  const commonLocations = {
    "jfk": "Queens, New York, USA",
    "lax": "Los Angeles, California, USA",
    "heathrow": "London, UK",
    "delhi": "New Delhi, India",
    "mumbai": "Mumbai, Maharashtra, India",
    "o'hare": "Chicago, Illinois, USA",
  };
  
  const normalizedName = airportName.toLowerCase();
  
  for (const [key, location] of Object.entries(commonLocations)) {
    if (normalizedName.includes(key)) {
      return location;
    }
  }
  
  return "International Location";
}

// Gemini API for other airport queries
async function fetchGeminiResponse(prompt) {
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyB2mId-X_ScfyAEv6lDYd_WgsiFAaJsBv8", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't find the information.";
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Oops! Something went wrong while contacting the Gemini API.";
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
  while (recentChatsList.children.length > 10) {
    recentChatsList.removeChild(recentChatsList.lastChild);
  }
}

// Sidebar toggle
toggleSidebarBtn.addEventListener("click", () => {
  sidebar.classList.toggle("hidden");
  setTimeout(() => chatBox.scrollTop = chatBox.scrollHeight, 300);
});

// Message input
sendBtn.addEventListener("click", handleUserMessage);
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleUserMessage();
});

// Welcome message
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    addMessage("Welcome! I'm AirportBot. Ask me anything about airports, flights, terminals, or travel information. Try asking about a flight status like 'What's the status of AI 302?' or 'Show departures from JFK airport'.", "bot", true);
  }, 500);
});

// Mobile nav toggle
document.querySelector('.nav-mobile-toggle').addEventListener('click', () => {
  document.querySelector('.nav-links').classList.toggle('active');
});

document.addEventListener('click', (event) => {
  const navLinks = document.querySelector('.nav-links');
  const mobileToggle = document.querySelector('.nav-mobile-toggle');
  if (!navLinks.contains(event.target) && !mobileToggle.contains(event.target) && navLinks.classList.contains('active')) {
    navLinks.classList.remove('active');
  }
});
