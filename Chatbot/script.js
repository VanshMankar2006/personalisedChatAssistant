document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chatForm');
    const userInput = document.getElementById('userInput');
    const chatFeed = document.getElementById('chatFeed');
    const sendBtn = document.getElementById('sendBtn');
    const chips = document.querySelectorAll('.chip-btn');
    const initTime = document.getElementById('initTime');

    // API endpoint target for streaming DTOs
    const API_URL = 'http://localhost:8080/api/chat';

    if (initTime) {
        initTime.textContent = getCurrentTime();
    }

    // Retrieve or generate persistent session identifier
    let sessionId = localStorage.getItem('pujas_bakery_session_id');
    if (!sessionId) {
        sessionId = 'pb_session_' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('pujas_bakery_session_id', sessionId);
    }

    // Attach event listener to Quick Suggestion Chips
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const query = chip.getAttribute('data-query');
            if (query) {
                userInput.value = query;
                chatForm.dispatchEvent(new Event('submit'));
            }
        });
    });

    // Form Submit Event Handler
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const text = userInput.value.trim();
        if (!text) return;

        // 1. Render User Message
        appendMessage(text, 'user');
        userInput.value = '';
        toggleInputState(true);

        // 2. Render Typing Indicator
        const typingElem = appendTypingIndicator();

        try {
            // 3. Make HTTP POST Request sending JSON DTO body and expecting event-stream
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream'
                },
                body: JSON.stringify({ message: text })
            });

            if (!response.ok) {
                throw new Error('Server returned an error response.');
            }

            // Remove typing indicator once connection is established
            typingElem.remove();

            // 4. Create empty Bot message bubble for live streaming chunks
            const botRow = appendMessage('', 'bot');
            const botBubble = botRow.querySelector('.bubble');
            
            let fullStreamedText = '';

            // 5. Read stream chunk by chunk and parse SSE JSON DTO objects
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                
                // SSE events are typically separated by double newlines
                const lines = buffer.split('\n\n');
                buffer = lines.pop(); // Keep any trailing partial data chunk in buffer

                for (const line of lines) {
                    if (line.startsWith('data:')) {
                        const jsonString = line.replace('data:', '').trim();
                        if (jsonString) {
                            try {
                                // Parse the ChatResponseDto JSON packet
                                const chatDto = JSON.parse(jsonString);
                                
                                // Append the response text property from DTO
                                if (chatDto.response) {
                                    fullStreamedText += chatDto.response;
                                    botBubble.innerHTML = formatText(fullStreamedText);
                                    scrollToBottom();
                                }
                            } catch (parseErr) {
                                console.error('Failed to parse incoming DTO chunk:', parseErr);
                            }
                        }
                    }
                }
            }

        } catch (err) {
            console.error('Error connecting to the chat backend:', err);
            typingElem.remove();
            appendMessage("Sorry, I'm having trouble connecting to Puja's Bakery right now. Please try again later.", 'bot');
        } finally {
            toggleInputState(false);
            userInput.focus();
        }
    });

    // Append a chat bubble to the feed
    function appendMessage(content, sender) {
        const row = document.createElement('div');
        row.className = `message-row ${sender}-row`;

        const bubble = document.createElement('div');
        bubble.className = `bubble ${sender}-bubble`;
        bubble.innerHTML = formatText(content);

        const time = document.createElement('span');
        time.className = 'meta-time';
        time.textContent = getCurrentTime();

        row.appendChild(bubble);
        row.appendChild(time);
        chatFeed.appendChild(row);

        scrollToBottom();
        return row;
    }

    // Append typing dots
    function appendTypingIndicator() {
        const row = document.createElement('div');
        row.className = `message-row bot-row`;

        const bubble = document.createElement('div');
        bubble.className = `bubble bot-bubble typing-container`;
        bubble.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;

        row.appendChild(bubble);
        chatFeed.appendChild(row);
        scrollToBottom();

        return row;
    }

    // Toggle form input state
    function toggleInputState(disabled) {
        userInput.disabled = disabled;
        sendBtn.disabled = disabled;
    }

    // Scroll chat feed to latest message
    function scrollToBottom() {
        chatFeed.scrollTop = chatFeed.scrollHeight;
    }

    // Get current local time format
    function getCurrentTime() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Safe HTML formatting & line breaks handling
    function formatText(str) {
        if (!str) return '';
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\n/g, "<br>");
    }
});