document.addEventListener('DOMContentLoaded', function() {
    const messagesContainer = document.getElementById('messages');
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const welcomeText = document.querySelector('.welcome-text');
    const chatCard = document.querySelector('.chat-card');

    userInput.addEventListener('input', function() {
        sendButton.disabled = !this.value.trim();
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 150) + 'px';
    });

    chatForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const message = userInput.value.trim();
        if (!message) return;

        if (welcomeText) {
            welcomeText.style.display = 'none';
        }
        chatCard.classList.add('expanded');

        addMessage('user', message);
        userInput.value = '';
        sendButton.disabled = true;

        const typingIndicator = createTypingIndicator();
        typingIndicator.style.display = 'block';

        try {
            const responseContainer = createResponseContainer();
            responseContainer.style.display = 'none';
            let fullResponse = '';
            
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream'
                },
                body: JSON.stringify({ message })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                
                if (done) {
                    console.log('Stream complete');
                    sendButton.disabled = false;
                    typingIndicator.remove();
                    responseContainer.style.display = 'block';
                    scrollToBottom();
                    break;
                }

                if (fullResponse === '') {
                    typingIndicator.remove();
                    responseContainer.style.display = 'block';
                }

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            
                            if (data.status === 'chunk') {
                                fullResponse += data.content;
                                responseContainer.innerHTML = '';
                                
                                const copyButton = document.createElement('button');
                                copyButton.className = 'copy-button';
                                copyButton.textContent = 'Copy';
                                copyButton.onclick = async function() {
                                    try {
                                        await navigator.clipboard.writeText(fullResponse);
                                        copyButton.textContent = 'Copied!';
                                        copyButton.classList.add('copied');
                                        setTimeout(() => {
                                            copyButton.textContent = 'Copy';
                                            copyButton.classList.remove('copied');
                                        }, 2000);
                                    } catch (err) {
                                        console.error('Failed to copy:', err);
                                        copyButton.textContent = 'Failed!';
                                        setTimeout(() => {
                                            copyButton.textContent = 'Copy';
                                        }, 2000);
                                    }
                                };

                                if (fullResponse.includes('```')) {
                                    let parts = fullResponse.split('```');
                                    let formattedContent = '';
                                    
                                    parts.forEach((part, index) => {
                                        if (index % 2 === 0) {
                                            formattedContent += part;
                                        } else {
                                            let code = part.trim();
                                            let language = 'plaintext';
                                            
                                            if (code.includes('\n')) {
                                                let firstLine = code.split('\n')[0];
                                                if (firstLine) {
                                                    language = firstLine;
                                                    code = code.split('\n').slice(1).join('\n');
                                                }
                                            }
                                            
                                            formattedContent += `<pre class="line-numbers"><code class="language-${language}">${escapeHTML(code)}</code></pre>`;
                                        }
                                    });
                                    
                                    responseContainer.innerHTML = formattedContent;
                                } else {
                                    responseContainer.textContent = fullResponse;
                                }

                                responseContainer.appendChild(copyButton);
                                
                                responseContainer.querySelectorAll('pre code').forEach((block) => {
                                    Prism.highlightElement(block);
                                });
                                
                                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                            } 
                            else if (data.status === 'error') {
                                console.error('Server error:', data);
                                responseContainer.textContent = `Error: ${data.message}`;
                                typingIndicator.remove();
                                sendButton.disabled = false;
                                scrollToBottom();
                                break;
                            }
                            else if (data.status === 'done') {
                                console.log('Stream finished');
                                sendButton.disabled = false;
                                scrollToBottom();
                            }
                        } catch (e) {
                            console.error('Error parsing SSE data:', e, 'Line:', line);
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Fetch error:', error);
            addMessage('assistant', `Error: ${error.message}`);
            typingIndicator.remove();
            sendButton.disabled = false;
        }
    });

    function createTypingIndicator() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant';
        
        const indicatorDiv = document.createElement('div');
        indicatorDiv.className = 'typing-indicator message-content';
        indicatorDiv.innerHTML = 'My Assistant is typing<span>.</span><span>.</span><span>.</span>';
        
        messageDiv.appendChild(indicatorDiv);
        messagesContainer.appendChild(messageDiv);
        
        scrollToBottom();
        return messageDiv;
    }

    function createResponseContainer() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);
        
        return contentDiv;
    }

    function addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.textContent = 'Copy';
        copyButton.onclick = async function() {
            try {
                const textToCopy = content;
                await navigator.clipboard.writeText(textToCopy);
                
                copyButton.textContent = 'Copied!';
                copyButton.classList.add('copied');
                
                setTimeout(() => {
                    copyButton.textContent = 'Copy';
                    copyButton.classList.remove('copied');
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
                copyButton.textContent = 'Failed!';
                setTimeout(() => {
                    copyButton.textContent = 'Copy';
                }, 2000);
            }
        };

        if (content.includes('```')) {
            let parts = content.split('```');
            let formattedContent = '';
            
            parts.forEach((part, index) => {
                if (index % 2 === 0) {
                    formattedContent += part;
                } else {
                    let code = part.trim();
                    let language = 'plaintext';
                    
                    if (code.includes('\n')) {
                        let firstLine = code.split('\n')[0];
                        if (firstLine) {
                            language = firstLine;
                            code = code.split('\n').slice(1).join('\n');
                        }
                    }
                    
                    formattedContent += `<pre class="line-numbers"><code class="language-${language}">${escapeHTML(code)}</code></pre>`;
                }
            });
            
            contentDiv.innerHTML = formattedContent;
        } else {
            contentDiv.textContent = content;
        }
        
        contentDiv.appendChild(copyButton);
        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);
        
        messageDiv.querySelectorAll('pre code').forEach((block) => {
            Prism.highlightElement(block);
        });
        
        const anchor = document.createElement('div');
        anchor.className = 'scroll-anchor';
        messagesContainer.appendChild(anchor);
        anchor.scrollIntoView({ behavior: 'smooth' });
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag]));
    }

    function scrollToBottom() {
        const lastMessage = messagesContainer.lastElementChild;
        if (lastMessage) {
            lastMessage.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }
});