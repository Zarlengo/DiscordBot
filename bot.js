// Add discord dependency
const Discord = require('discord.js');

// File containing secret keys (.sample is the file with the keys removed)
const auth = require('./auth.json');

// Initialize Discord Bot
const bot = new Discord.Client();
bot.login(auth.token);

// Default poll settings
const defaultGame = "Factorio";
const defaultTime = "7:30 PM";

// Variables
let game = defaultGame;
let gameTime = defaultTime;
let timerInterval = [];
let running = false;
const dayToMs = 24 * 60 * 60 * 1000; // Hours * Minutes * Seconds * Milliseconds
let timeInterval = 7 * dayToMs;

// Function to get the number of milliseconds between 'start' and sunday @ noon
const getSunday = () => {
    let currentDateTime = Date.now();
    const today = new Date();
    const sunday = today - today.getHours() * 60 * 60 * 1000 - today.getMinutes() * 60 * 1000 - today.getSeconds() * 1000 - today.getMilliseconds() + 13.59 * 60 * 60 * 1000;// + (7 - today.getDay()) * dayToMs;
    return sunday - currentDateTime;
}

// Formatted help message for the bot
const helpMessage = `gamePoll help
    Shows available commands

gamePoll game GameName can include spaces
    Changes default game for the poll

gamePoll start
    Starts the auto polling service

gamePoll stop
    Stops the auto polling service

gamePoll status
    Shows the current state of the bot
`

// Console output when bot is first loaded
bot.once('ready', () => {
    console.log(`Connected. Logged in as: ${ bot.user.username } (${ bot.user.id })`);
});

// Bot reaction to messages
bot.on('message', message => {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.content.substring(0, 1) == '!') {
        // Gets the first word after ! to check if it is valid
        let args = message.content.substring(1).split(' ');
        let cmd = args[0].toLowerCase();
        args = args.splice(1);
        switch(cmd) {
            // Cases !gp and !gamePoll (not case sensitive) perform bot actions
            case 'gp':
            case 'gamepoll':
                // If there was an argument added to the command
                if (args.length > 0) {
                    // Gets any tertiary arguments (i.e. game name)
                    let cmdType = args[0].toLowerCase();
                    let cmdOptions = args.splice(1).join(" ");

                    // Chooses the option based on the argument
                    switch(cmdType) {
                        // Help screen
                        case 'help':
                            messageContent = helpMessage;                            
                            break;

                        // Change game name
                        case 'game':
                            game = cmdOptions;

                            // If the service is currently running, stops future messages and stops service
                            if (running) {
                                for (let i = 0; i < timerInterval.length; i++) {
                                    clearTimeout(timerInterval[i]);
                                }
                                running = false;
                            }
                            messageContent = `Game changed to ${ game }. Service has been stopped`;
                            break;

                        // Start weekly auto polling
                        case 'start':
                            // If the service is currently running, stops future messages
                            if (running) {
                                for (let i = 0; i < timerInterval.length; i++) {
                                    clearTimeout(timerInterval[i]);
                                }                                
                            }
                            // Changes the running Boolean to true
                            running = true;

                            // Gets the milliseconds between now and sunday @ noon
                            const timeToSunday = getSunday();

                            // Performs 3 loops of the auto polling (setTimeout is limited to 25 days)
                            for (let i = 0; i < 3; i ++) {
                                timerInterval[i - 1] = setTimeout(() => {
                                    sendChannelMessage(pollMessage(game, gameTime));
                                }, timeInterval * i + timeToSunday);
                            }

                            // Sends a message to the author when the service has finished so they can start a new cycle
                            timerInterval[3] = setTimeout(() => {
                                sendAuthorMessage(message, "Service has completed. Enter '!gamePoll start' for the next cycle.");
                                running = false;
                            }, timeInterval * 2 + timeToSunday);

                            // Message to the author that the service has been started successfully
                            messageContent = `Service has been started: ${ game} @ ${ gameTime }`;
                            break;

                        // Stop auto polling
                        case 'stop':
                            // Stops any future messages
                            running = false;
                            for (let i = 0; i < timerInterval.length; i++) {
                                clearTimeout(timerInterval[i]);
                            }

                            // Sends an update to the user
                            messageContent = "Service has been stopped";
                            break;

                        // Gets the current state of the bot
                        case 'status':
                            if (running) {
                                messageContent = `Service is running: ${ game} @ ${ gameTime }`;
                            } else {
                                messageContent = `Service is not running: ${ game} @ ${ gameTime }`;
                            }
                            break;

                        // If the argument is not on the list
                        default:
                            messageContent = `Unrecognized command: ${ args }`;
                    }

                // Defaults to help message if no argument is included
                } else {                    
                    messageContent = helpMessage;
                }
                break;

            // Help message
            case 'help':
            default:
                messageContent = helpMessage;
                break;
        }
        // Function to send a direct reply back to the person, avoids channel talk
        sendAuthorMessage(message, messageContent);
    }
});

// Function to get the poll message default format
const pollMessage = (gameName = "Factorio", gameTime = "7:30") => {
    return `${ gameName} @ ${ gameTime }
  :regional_indicator_t: = Tuesday
  :regional_indicator_r: = Thursday
  :regional_indicator_f: = Friday`;
}

// Function to send a private message to the author
const sendAuthorMessage = (message, messageContent) => {
    message.author.send(messageContent);
}

// Function to send a message to the whole channel
const sendChannelMessage = (messageContent) => {
    bot.channels.cache.get(auth.channelID).send(messageContent)
        .then(response => {
            response.react("🇹");
            response.react("🇷");
            response.react("🇫");
        });
}
