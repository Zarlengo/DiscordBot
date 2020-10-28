const Discord = require('discord.js');
const auth = require('./auth.json');
// Configure logger settings
// Initialize Discord Bot

const bot = new Discord.Client();
bot.login(auth.token);

const defaultGame = "Factorio";
const defaultTime = "7:30 PM";

let game = defaultGame;
let gameTime = defaultTime;

let reaction = false;
let timerInterval = [];
let running = false;

let timeInterval = 7 * 24 * 60 * 60 * 1000 // Days * Hours * Minutes * Seconds * Milliseconds
let dateTime = Date.now();


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

bot.once('ready', () => {
    console.log(`Connected. Logged in as: ${ bot.user.username } (${ bot.user.id })`);
});

bot.on('message', message => {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.content.substring(0, 1) == '!') {
        let args = message.content.substring(1).split(' ');
        let cmd = args[0].toLowerCase();
        args = args.splice(1);
        switch(cmd) {
            case 'gp':
            case 'gamepoll':
                if (args.length > 0) {
                    let cmdType = args[0].toLowerCase();
                    let cmdOptions = args.splice(1).join(" ");
                    switch(cmdType) {
                        case 'help':
                            messageContent = helpMessage;                            
                            break;
                        case 'game':
                            game = cmdOptions;
                            running = false;
                            for (let i = 0; i < timerInterval.length; i++) {
                                clearTimeout(timerInterval[i]);
                            }
                            messageContent = `Game changed to ${ game }. Service has been stopped`;
                            break;
                        case 'start':
                            running = true;
                            for (let i = 1; i <= 5; i ++) {
                                timerInterval[i - 1] = setTimeout(() => {
                                    sendMessage(message, pollMessage(game, gameTime), true);
                                }, 3000 * i);
                            }
                            messageContent = `Service has been started: ${ game} @ ${ gameTime }`;
                            break;
                        case 'stop':
                            running = false;
                            for (let i = 0; i < timerInterval.length; i++) {
                                clearTimeout(timerInterval[i]);
                            }
                            messageContent = "Service has been stopped";
                            break;
                        case 'status':
                            reaction = false;
                            if (running) {
                                messageContent = `Service is running: ${ game} @ ${ gameTime }`;
                            } else {
                                messageContent = `Service is not running: ${ game} @ ${ gameTime }`;
                            }
                            break;
                        default:
                            messageContent = `Unrecognized command: ${ args }`;
                    }
                } else {                    
                    messageContent = helpMessage;
                }
                break;

            case 'help':
            default:
                messageContent = helpMessage;
                break;
        }
        sendMessage(message, messageContent, reaction);
        reaction = false;
    }
});

const pollMessage = (gameName = "Factorio", gameTime = "7:30") => {
    return `${ gameName} @ ${ gameTime }
  :regional_indicator_t: = Tuesday
  :regional_indicator_r: = Thursday
  :regional_indicator_f: = Friday`;
}

const sendMessage = (message, messageContent, reaction) => {
    message.channel.send(messageContent)
        .then(response => {
            if (reaction) {
                response.react("🇹");
                response.react("🇷");
                response.react("🇫");
            }
        });
}
