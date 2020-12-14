const fs = require('fs');
const haikudos = require('haikudos');
const wordnet = require('wordnet');
const axios = require('axios').default;
const cheerio = require('cheerio');
const Trivia = require('./Trivia').Trivia
const whconsole = require('./whconsole');
const _ = require('lodash');
const { htmlToText } = require('html-to-text');

let config_file = fs.readFileSync('config.json');
let config = JSON.parse(config_file);

// let data_file = fs.readFileSync('data.json');
// let data = JSON.parse(data_file);

let getData = () => {
    return new Promise((resolve, reject) => {
        try {
            fs.readFile('data.json', (err, data_file) => {
                if (err) { reject(err) } else {
                    resolve(JSON.parse(data_file));
                }
            });
        } catch (err) { reject(err); }
    })
}

let knownCommands = { echo, haiku, trivia, word, wotd, }//trivia, wotd }; //, confess }

let dmCommands = { confess, invite };

let confession_channel;
let bot_test_channel;
let trivia_channel;

let _trivia;

let active_trivias = {};
let trivia_channels = [];

function echo(params, message, callback) {
    // If there's something to echo:
    if (params.length) {
        // Join the params into a string:
        const msg = params.join(' ')
        // Send it back to the correct place:
        callback(msg);
    } else { // Nothing to echo
        whconsole.log(`* Nothing to echo`)
    }
}

// Function called when the "haiku" command is issued:
function haiku(params, message, callback) {
    // Generate a new haiku:
    haikudos((newHaiku) => {
        // Split it line-by-line:
        callback(`\n${newHaiku.split('\n')}`);
    })
}

function word(params, message, callback) {
    if (params.length) {
        const word = params[0].toLowerCase();
        wordnet.lookup(word, function (err, definitions) {
            if (err) {
                whconsole.log(err);
                callback(`<:NXcapoocry:646652140684574720> Something went wrong... *${err}*`);
            } else {
                let output = '';
                definitions.forEach(function (definition, i) {
                    // output += `words: ${words.trim()}\n`;
                    output += `${i + 1} : ${definition.glossary}\n`;
                });
                callback(`<:NXcapoowave:646652140684836874>\nDefinitions of **${word}**:\n ${output}`);
            }
        });
    }
}

function trivia(params, message, callback) {
    // _trivia.activate(params, callback);    
    try {
        if (trivia_channels.includes(message.channel.id)) {
            whconsole.log('activating existing trivia');
            active_trivias[message.channel.id].activate();
            whconsole.log('activated existing trivia');
        } else {
            trivia_channels.push(message.channel.id);
            whconsole.log('creating new trivia');
            active_trivias[message.channel.id] = new Trivia(message.channel);
            whconsole.log('activating new trivia');
            active_trivias[message.channel.id].activate();
        }
    } catch (err) {
        whconsole.log(err);
    }
}

function wotd(params, message, callback) {
    getData().then((data) => {
        let wotd_downloaded = data.wotd ? data.wotd.downloaded : false;
        if (!wotd_downloaded) {
            axios.get('https://www.merriam-webster.com/word-of-the-day').then((res) => {

                let body = res.data;
                const $ = cheerio.load(body);
                let word_raw = $('.word-header h1').text();
                let word = word_raw.charAt(0).toUpperCase() + word_raw.slice(1);
                let attribute = $('body > div.outer-container > div > div.main-wrapper.clearfix > main > article > div.article-header-container.wod-article-header > div.quick-def-box > div.word-attributes > span.main-attr').text();

let definition = [];
$('body > div.outer-container > div > div.main-wrapper.clearfix > main > article > div.lr-cols-area.clearfix.sticky-column > div.left-content > div > div.wod-definition-container').find('p').each((i, p) => {
	if($(p).find('strong').text().includes(':')) {
		definition.push(htmlToText($(p).html()));
	}
	
});

                let wotd = {
                    word: word,
                    attribute: attribute,
                    definition: definition.join('\n'),
                    downloaded: true
                };

                data.wotd = wotd;

                fs.writeFileSync('data.json', JSON.stringify(data));

                callback(`The word of the day is: **${word}** - *(${attribute})* <:NXcapoowave:646652140684836874>\n*Definition(s)*\n *${data.wotd.definition}*`);
            }).catch(err => console.log(err));
        } else {
            callback(`The word of the day is: **${data.wotd.word}** - *(${data.wotd.attribute})* <:NXcapoowave:646652140684836874>\n*Definition(s)*\n *${data.wotd.definition}*`);
        }
    });
}

// dm commands

function confess(params, channel_id, callback) {
    let confession = params.join(' ');
    let confession_id = config.confession_id
    confession_channel.send(`**#${confession_id} Confession:**\n ${confession}`)
    confession_id += 1;
    config.confession_id = confession_id;

    // fs.unlinkSync(filePath)
    fs.writeFileSync('config.json', JSON.stringify(config));
    callback('Confession submitted to page!');
}

function invite(params, message, callback) {    
    callback('https://discordapp.com/oauth2/authorize?client_id=191630078269063168&scope=bot');
}

module.exports = {
    Trivia: function () { return _trivia; },
    knownCommands: knownCommands,
    parseCommand: function (client, msg, callback) {
        // Split the message into individual words:
        const parse = msg.content.slice(1).split(' ');
        // The command name is the first (0th) one:
        const commandName = parse[0].toLowerCase();
        // The rest (if any) are the parameters:
        const params = parse.splice(1);

        confession_channel = client.channels.get("646374450555650059");

        bot_test_channel = client.channels.get('646335117190496256');
        trivia_channel = client.channels.get('647093527138009088');

        // Initialize Trivia
        // if (!_trivia) _trivia = new Trivia(bot_test_channel, client);
        // If the command is known, let's execute it:
        if (commandName in dmCommands) {
            if (msg.channel.type === 'dm') {
                const command = dmCommands[commandName];
                // Then call the command with parameters:            
                whconsole.log(`* Executed ${commandName} command for ${msg.author.tag}`);
                command(params, msg, (result) => {
                    callback(result);
                });
            } else {
                whconsole.log(`* Trying to use dm command ${commandName} outside of dm from ${msg.author.tag}`);
            }
        }
        else if (commandName in knownCommands) {
            // Retrieve the function by its name:
            const command = _.debounce(knownCommands[commandName], 500);
            // Then call the command with parameters:            
            whconsole.log(`* Executed ${commandName} command for ${msg.author.tag}`);

            command(params, msg, (result) => {
                callback(result);
            });
        }
        else {
            whconsole.log(`* Unknown command ${commandName} from ${msg.author.tag}`);
        }
    }
}
