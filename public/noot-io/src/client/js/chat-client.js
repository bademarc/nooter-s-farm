var global = require('./global');

class ChatClient {
    constructor() {
        this.commands = {};
        var self = this;
        this.registerCommand('ping', 'Check your latency.', function () {
            global.startPingTime = Date.now();
            self.socket.emit('pingcheck');
        });

        this.registerCommand('dark', 'Toggle dark mode.', function () {
            document.getElementById('darkMode').checked = !document.getElementById('darkMode').checked;
            document.getElementById('darkMode').onchange();
            self.addSystemLine('Dark mode toggled.');
        });

        this.registerCommand('border', 'Toggle visibility of border.', function () {
            document.getElementById('visBord').checked = !document.getElementById('visBord').checked;
            document.getElementById('visBord').onchange();
            self.addSystemLine('Border visibility toggled.');
        });

        this.registerCommand('mass', 'Toggle visibility of mass.', function () {
            document.getElementById('showMass').checked = !document.getElementById('showMass').checked;
            document.getElementById('showMass').onchange();
            self.addSystemLine('Mass visibility toggled.');
        });

        this.registerCommand('continuity', 'Toggle continuity.', function () {
            document.getElementById('continuity').checked = !document.getElementById('continuity').checked;
            document.getElementById('continuity').onchange();
            self.addSystemLine('Continuity toggled.');
        });

        this.registerCommand('roundfood', 'Toggle food drawing.', function () {
            document.getElementById('roundFood').checked = !document.getElementById('roundFood').checked;
            document.getElementById('roundFood').onchange();
            self.addSystemLine('Food drawing toggled.');
        });

        this.registerCommand('help', 'Information about the chat commands.', function () {
            self.printHelp();
        });

        this.registerCommand('login', 'Login as an admin.', function (args) {
            self.socket.emit('pass', args);
        });

        this.registerCommand('kick', 'Kick a player, for admins only.', function (args) {
            self.socket.emit('kick', args);
        });

        this.registerCommand('farm', 'Get some farm coins.', function () {
            try {
                if (global.player && global.player.massTotal > 100) {
                    // Only works if player has at least 100 mass
                    // Send message to parent window
                    window.parent.postMessage({
                        type: 'noot-io',
                        action: 'earn-coins',
                        coins: 10
                    }, '*');
                    self.addSystemLine('You received 10 farm coins!');
                } else {
                    self.addSystemLine('You need to be bigger to earn farm coins (>100 mass).');
                }
            } catch (e) {
                self.addSystemLine('Error: ' + e.message);
            }
        });

        global.chatClient = this;
    }

    registerCommand(name, description, callback) {
        this.commands[name] = {
            description: description,
            callback: callback
        };
    }

    printHelp() {
        var self = this;
        self.addSystemLine('Available Commands:');
        for (var cmd in this.commands) {
            if (this.commands.hasOwnProperty(cmd)) {
                self.addSystemLine('-' + cmd + ': ' + this.commands[cmd].description);
            }
        }
    }

    sendMessage(message) {
        if (!message || message.length === 0) return;
        
        // Check if message is a command
        if (message[0] === '-') {
            var args = message.slice(1).split(' ');
            var cmd = args[0];
            args.shift();
            
            if (this.commands[cmd]) {
                this.commands[cmd].callback(args);
            } else {
                this.addSystemLine('Unknown Command: ' + cmd + '. Type -help for a list of commands.');
            }
            return;
        }
        
        // Normal message send
        this.addChatLine(this.player.name, message, true);
        this.socket.emit('playerChat', { sender: this.player.name, message: message });
    }

    addChatLine(name, message, me) {
        var chatList = document.getElementById('chatList');
        var chatLine = document.createElement('li');
        
        chatLine.className = me ? 'me' : 'friend';
        chatLine.innerHTML = '<b>' + (name || 'Anonymous') + '</b>: ' + message;
        
        // Keep chat list scrolled to bottom
        var shouldScroll = chatList.scrollTop + chatList.clientHeight === chatList.scrollHeight;
        
        chatList.appendChild(chatLine);
        
        if (shouldScroll) {
            chatList.scrollTop = chatList.scrollHeight;
        }
    }

    addSystemLine(message) {
        var chatList = document.getElementById('chatList');
        var chatLine = document.createElement('li');
        
        chatLine.className = 'system';
        chatLine.innerHTML = message;
        
        // Keep chat list scrolled to bottom
        var shouldScroll = chatList.scrollTop + chatList.clientHeight === chatList.scrollHeight;
        
        chatList.appendChild(chatLine);
        
        if (shouldScroll) {
            chatList.scrollTop = chatList.scrollHeight;
        }
    }

    // Process chat input before sending to server
    handleChatInput(event) {
        var key = event.which || event.keyCode;
        
        if (key === global.KEY_ENTER) {
            var text = document.getElementById('chatInput').value;
            
            if (text !== '') {
                // Send message
                this.sendMessage(text);
                
                // Clear input
                document.getElementById('chatInput').value = '';
            }
            
            // Hide chat input and blur focus
            document.getElementById('chatInput').blur();
        }
    }

    registerFunctions() {
        var self = this;
        document.getElementById('chatInput').addEventListener('keypress', function (event) {
            self.handleChatInput(event);
        });
    }
}

module.exports = ChatClient; 