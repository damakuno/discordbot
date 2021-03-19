const cluster = require('cluster');

//  if (cluster.isMaster) {
//    cluster.fork();

//    cluster.on('exit', function (worker, code, signal) {
//      cluster.fork();
//    });
//  }

//  if (cluster.isWorker) {
//    startbot();
//  }

//https://discordapp.com/oauth2/authorize?client_id=191630078269063168&scope=bot
startbot();

function startbot() {
  const fs = require('fs');
  const Discord = require('discord.js');
  const c = require('./cmd');
  const jobs = require('./jobs');
  const whconsole = require('./whconsole');
  let config_file = fs.readFileSync('config.json');
  let config = JSON.parse(config_file);

  let commandPrefix = config.commandPrefix;

  const client = new Discord.Client();
  
  jobs.scheduleJobs();

  let adhoc_responses = {
    "you don't love me anymore": "That's not true... <:NXcapoocry:646652140684574720>",
    "you dont love me anymore": "That's not true... <:NXcapoocry:646652140684574720>",
    "you don love me anymore": "That's not true... <:NXcapoocry:646652140684574720>",
    "i love you": "I love you too ❤️",
    "anh ơi": "anh đây... <:NXcapoowave:646652140684836874>",
    "em ơi": "em đây... <:NXcapoowave:646652140684836874>",
    "xạo": "không xạo <:NXcapoocri:695087074600288348>",
    "xạo!": "không xạo! <:NXcapoocri:695087074600288348>",
"ping":"Pong!"
  }

  try {
    client.on('ready', () => {
      whconsole.log(`Logged in as ${client.user.tag}!`);
	whconsole.log(`The time is ${new Date(Date.now())}`);
      module.exports = {
        client_user_id: client.user.id
      }
    });

    client.on('message', msg => {
      try {
        let author = msg.author;
        let confession_channel = client.channels.cache.get("646374450555650059");
        // Don't respond to self messages
        if (client.user.id === author.id) {
          //maybe do something if it receives its own message
        } else {
          if (msg.content.substr(0, 1) !== commandPrefix) {
            if (Object.keys(adhoc_responses).includes(msg.content.toLowerCase().trim()))
              msg.reply(adhoc_responses[msg.content.toLowerCase().trim()]);
          } else {
            c.parseCommand(client, msg, (result) => {
              if (result) {
                msg.reply(result);
              }
            });
          }
        }
        // if (msg.content === 'ping') {
        //   msg.reply('Pong!');
        // }
      } catch (err) {
        whconsole.log(err);
      }
    });


    // const react_choice = {
    //   '1️⃣': 0,
    //   '2️⃣': 1,
    //   '3️⃣': 2,
    //   '4️⃣': 3
    // }

    // client.on('messageReactionAdd', (msgReaction, user) => {
    //   try {
    //     let message = msgReaction.message;
    //     let channel = message.channel;
    //     let Trivia = c.Trivia();
    //     if (client.user.id === user.id) {
    //       //maybe do something if it receives its own
    //     } else {
    //       // Handle Trivia
    //       if (Trivia.category_select_active) {
    //         if (message.id === Trivia.category_message.id) {
    //           if (Object.keys(react_choice).includes(msgReaction.emoji.name)) {
    //             let choice = react_choice[msgReaction.emoji.name];
    //             Trivia.set_options_category(choice);
    //             Trivia.ask();
    //             channel.send(`<@${user.id}>, you chose: **${Trivia.active_categories[choice].name}**`);
    //             Trivia.category_select_active = false;
    //           }
    //         }
    //       } else if (Trivia.active) {
    //         if (message.id === Trivia.message.id) {
    //           if (Object.keys(react_choice).includes(msgReaction.emoji.name)) {
    //             if (react_choice[msgReaction.emoji.name] === Trivia.correct_answer_index) {
    //               channel.send(`Congratulations <@${user.id}>, you got it! <:NXcapoowave:646652140684836874> The correct answer is: **${decodeURIComponent(Trivia.answers[Trivia.correct_answer_index]).trim()}**`);
    //             } else {
    //               channel.send(`Nice try <@${user.id}>, but that was not the correct answer... <:NXcapoocry:646652140684574720> The correct answer is: **${decodeURIComponent(Trivia.answers[Trivia.correct_answer_index]).trim()}**`);
    //             }
    //             Trivia.active = false;
    //           }
    //         }
    //       }
    //     }
    //   } catch (err) {
    //     whconsole.log(err);
    //   }
    // });

    client.login(config.token).then(() => {}).catch((err) => { whconsole.log(err); process.exit(1); });


  } catch (err) {
    whconsole.log(err);
  }

}
