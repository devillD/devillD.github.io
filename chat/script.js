const socket = io("https://www.asown.workers.dev");
let autoScrollEnabled = true; // Variable to track auto-scroll state
let isLoadingMoreMessages = false; // Flag to prevent multiple load triggers
let SECRET_KEY = 'xSAjwEE70Ilu4EN6iM1yTB-9A6ut4OfWDVmlZi82Q_w='; // Secret key should be generated and securely shared

// Function to securely set the secret key
function setSecretKey(newKey) {
    SECRET_KEY = newKey; // You can implement secure key exchange logic here
}

// Function to encrypt messages
function encryptMessage(message) {
    const iv = CryptoJS.lib.WordArray.random(16); 
    const encrypted = CryptoJS.AES.encrypt(message, CryptoJS.enc.Base64.parse(SECRET_KEY), { iv });
    return iv.toString() + ':' + encrypted.toString(); 
}

// Function to decrypt messages
function decryptMessage(ciphertext) {
    const parts = ciphertext.split(':'); 
    if (parts.length !== 2) {
        console.error('Invalid ciphertext format'); // Log error if format is wrong
        return null;
    }
    const iv = CryptoJS.enc.Hex.parse(parts[0]);
    const encryptedMessage = parts[1];

    const decrypted = CryptoJS.AES.decrypt(encryptedMessage, CryptoJS.enc.Base64.parse(SECRET_KEY), { iv });
    const decryptedMessage = decrypted.toString(CryptoJS.enc.Utf8); 

    if (!decryptedMessage) {
        console.warn('Decryption failed for message:', ciphertext); 
    }
    return decryptedMessage; 
}

// Validate username and room ID
function validateInputs() {
    const username = document.getElementById('username').value;
    const roomId = document.getElementById('roomId').value;

    // Username validation
    const usernameValid = /^[a-zA-Z0-9]{4,20}$/.test(username);
    document.getElementById('username').style.backgroundColor = usernameValid ? 'lightgreen' : 'lightcoral';

    // Room ID validation
    const roomIdValid = /^\d{1,5}$/.test(roomId);
    document.getElementById('roomId').style.backgroundColor = roomIdValid ? 'lightgreen' : 'lightcoral';

    return usernameValid && roomIdValid;
}

// Handle joining a room
document.getElementById('join').addEventListener('click', () => {
    if (validateInputs()) {
        const username = document.getElementById('username').value;
        const roomId = document.getElementById('roomId').value;

        socket.emit('joinRoom', { username, roomId });
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('chat-container').style.display = 'flex';
    } else {
        alert('Login failed: Please enter valid username and room ID.'); // Popup for login failure
    }
});

// Scroll to the bottom of the chat
function scrollToBottom() {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to the bottom
}

// Create message element
function createMessageElement(username, message, isCurrentUser, timestamp, imageUrl) {
    const msgElement = document.createElement('div');
    msgElement.className = isCurrentUser ? 'message user' : 'message receiver';

    // Check if there is an image URL
    if (imageUrl) {
        const imgElement = document.createElement('img');
        imgElement.src = imageUrl;
        imgElement.alt = "User uploaded image";
        imgElement.style.maxWidth = '200px'; // Set max width for images
        msgElement.appendChild(imgElement);
    } else {
        const decryptedMessage = decryptMessage(message); // Decrypt the message for display
        msgElement.innerText = decryptedMessage; // Set the text to decrypted message

        // Check if decryption failed
        if (!decryptedMessage) {
            console.warn('Decryption failed for message:', message); // Log warning if decryption fails
            msgElement.innerText = '[Message could not be decrypted]'; // Display a fallback message
        }
    }

    msgElement.dataset.timestamp = timestamp; // Set timestamp for loading older messages
    return msgElement;
}

// Receive previous messages when joining the room
socket.on('previousMessages', (messages) => {
    console.log("Received previous messages:", messages); // Log the messages to debug
    messages.forEach(({ username, message, timestamp, imageUrl }) => {
        const currentUser = document.getElementById('username').value;
        const msgElement = createMessageElement(username, message, username === currentUser, timestamp, imageUrl);
        document.getElementById('messages').appendChild(msgElement);
    });
    scrollToBottom(); // Scroll down after loading previous messages
});

// Receive older messages when scrolling up
socket.on('olderMessages', (messages) => {
    const messagesDiv = document.getElementById('messages');
    const previousScrollHeight = messagesDiv.scrollHeight;

    messages.forEach(({ username, message, timestamp, imageUrl }) => {
        const currentUser = document.getElementById('username').value;
        const msgElement = createMessageElement(username, message, username === currentUser, timestamp, imageUrl);
        messagesDiv.insertBefore(msgElement, messagesDiv.firstChild); // Insert at the top
    });

    // Maintain the scroll position to prevent jumping
    messagesDiv.scrollTop = messagesDiv.scrollHeight - previousScrollHeight;
    isLoadingMoreMessages = false; // Reset the loading flag
});

// Receive chat messages in real-time
socket.on('chatMessage', ({ user, message, imageUrl }) => {
    const currentUser = document.getElementById('username').value;

    // Check if the message contains an image or text
    if (imageUrl) {
        // Handle image messages
        const msgElement = createMessageElement(user, null, user === currentUser, null, imageUrl);
        document.getElementById('messages').appendChild(msgElement);
    } else {
        // Handle text messages
        const msgElement = createMessageElement(user, message, user === currentUser, null);
        document.getElementById('messages').appendChild(msgElement);
    }
    
    if (autoScrollEnabled) {
        scrollToBottom(); // Scroll down to the bottom if enabled
    }
});

// Handle image upload
document.getElementById('imageUpload').addEventListener('change', function() {
    const label = document.getElementById('imageUploadLabel');
    const file = this.files[0]; // Get the selected file

    if (file) {
        label.textContent = `📷 ${file.name}`; // Show the selected file name
        const reader = new FileReader(); // Create a FileReader to read the file
        reader.onload = function(event) {
            const imageData = event.target.result; // Get the file data
            const roomId = document.getElementById('roomId').value;

            // Emit image upload event
            socket.emit('imageUpload', {
                roomId: roomId,
                file: {
                    name: file.name,
                    data: imageData // Pass the image data as buffer
                }
            });

            document.getElementById('imageUpload').value = ''; // Clear file input after sending
            label.textContent = '📷'; // Reset the label text
        };
        reader.readAsArrayBuffer(file); // Read the file as an ArrayBuffer
    } else {
        label.textContent = '📷'; // Reset if no file is selected
    }
});

// Receive image upload confirmation and show in chat
socket.on('imageUpload', ({ user, imageUrl }) => {
    const currentUser = document.getElementById('username').value;
    const msgElement = createMessageElement(user, null, user === currentUser, null, imageUrl);
    document.getElementById('messages').appendChild(msgElement);

    if (autoScrollEnabled) {
        scrollToBottom(); // Scroll down to the bottom if enabled
    }
});

// Typing indicator management
let typingTimeout;
document.getElementById('message').addEventListener('input', () => {
    const roomId = document.getElementById('roomId').value;

    if (roomId) {
        socket.emit('typing', roomId); // Emit typing event
        clearTimeout(typingTimeout); // Clear previous timeout
        typingTimeout = setTimeout(() => {
            socket.emit('stopTyping', roomId); // Emit stop typing event after a delay
        }, 1000); // Adjust the delay as needed (1 second in this case)
    }
});

// Send message function
function sendMessage() {
    const messageInput = document.getElementById('message');
    const message = messageInput.value;
    const roomId = document.getElementById('roomId').value;

    if (message) {
        const encryptedMessage = encryptMessage(message); // Encrypt the message
        socket.emit('chatMessage', { roomId, message: encryptedMessage }); // Send encrypted message
        messageInput.value = ''; // Clear the input after sending
        socket.emit('stopTyping', roomId); // Emit stop typing event
    }
}

// Send message on button click
document.getElementById('send').addEventListener('click', sendMessage);

// Send message on pressing "Enter" key
document.getElementById('message').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        sendMessage(); // Call the sendMessage function
        event.preventDefault(); // Prevent form submission or newline
    }
});

// Receive typing indicator
socket.on('typing', (typingUser) => {
    const messagesDiv = document.getElementById('messages');
    const typingIndicator = messagesDiv.querySelector('.typing-indicator');
    const currentUser = document.getElementById('username').value;

    if (typingUser !== currentUser && !typingIndicator) {
        const typingElement = document.createElement('div');
        typingElement.className = 'typing-indicator';
        typingElement.innerText = `${typingUser} is typing...`;
        messagesDiv.appendChild(typingElement);
    }
});

// Stop typing indicator
socket.on('stopTyping', () => {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove(); // Remove the typing indicator when the user stops typing
    }
});

// Update active users
socket.on('updateActiveUsers', (users) => {
    const currentUser = document.getElementById('username').value;
    const filteredUsers = users.filter(u => u.username !== currentUser); // Remove current user from active users
    document.getElementById('active-users').innerHTML = 'Active Users: ' + filteredUsers.map(u => u.username).join(', ');
});

// Scroll event listener to load older messages when reaching the top
document.getElementById('messages').addEventListener('scroll', () => {
    const messagesDiv = document.getElementById('messages');

    // Check if the scroll is near the top and not currently loading more messages
    if (messagesDiv.scrollTop === 0 && !isLoadingMoreMessages) {
        isLoadingMoreMessages = true; // Set loading flag

        const roomId = document.getElementById('roomId').value;
        const firstMessageTimestamp = messagesDiv.firstChild?.dataset?.timestamp; // Get timestamp of the first message

        // Emit event to load more messages
        if (roomId && firstMessageTimestamp) {
            socket.emit('loadMoreMessages', { roomId, oldestMessageTimestamp: firstMessageTimestamp });
        }
    }

    // Determine if we are at the bottom of the messages div
    const isAtBottom = messagesDiv.scrollHeight - messagesDiv.scrollTop <= messagesDiv.clientHeight + 5; // Check if scrolled to the bottom
    autoScrollEnabled = isAtBottom; // Enable or disable auto-scroll based on position
});

// Initial scroll to bottom
scrollToBottom();
