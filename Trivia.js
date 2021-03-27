const fs = require('fs');
const axios = require('axios').default;
const whconsole = require('./whconsole');
// const app = require('./app');

let config_file = fs.readFileSync('config.json');
let config = JSON.parse(config_file);

// const client_user_id = app.client_user_id;

const choice_emoji = [
    '1️⃣',
    '2️⃣',
    '3️⃣',
    '4️⃣'
]

const react_choice = {
    '1️⃣': 0,
    '2️⃣': 1,
    '3️⃣': 2,
    '4️⃣': 3
}

const randInt = (min, max) => {
    return Math.floor(Math.random() * Math.floor(max - min + 1)) + min;
}

class Trivia {
    constructor(active_channel) {
        // this.client = app.getClient();
        this.active_channel = active_channel;
        this.categories = [];
        this.active_categories = [];
        this.content = [];
        this.answers = [];
        this.correct_answer_index = 0;
        this.options = { 'amount': '10', 'type': 'multiple', 'encode': 'url3986' };
        this.category_select_active = false;
        this.active = false;
        this.category_message = null;
        this.message = null;
    }

    // get_active_channel() {
    //     return client.channels.filter(c => c.id === this.channel_id).first();
    // }

    clearState() {
        this.categories = []
        this.content = [];
        this.answers = [];
        this.correct_answer_index = 0;
        this.active = false;
        this.category_message = null;
        this.message = null;
    }

    activate(params, callback) {
        // Don't allow another instance of trivia if one is active
        whconsole.log(`Trivia activate function is called from ${this.active_channel.name}, channel id: ${this.active_channel.id}`);
        if (this.active === true) {
            this.active_channel.send('Please wait, there is an on-going Trivia! <:NXcapoowave:646652140684836874>');
            this.send_question_message();
            return;
        }
        // Retrive categories
        if (this.categories.length < 4) {
            whconsole.log(`From ${this.active_channel.name}, channel id: ${this.active_channel.id}, retrive categories`);
            axios.get('https://opentdb.com/api_category.php').then((res) => {
                whconsole.log(`**From ${this.active_channel.name}, channel id: ${this.active_channel.id}, categories retrieved**`);
                if (res.data) {
                    this.categories = res.data.trivia_categories;
                    this.active_channel.send('Trivia time! <:NXcapoowave:646652140684836874>');
                    this.select_category();
                }
            });
        } else {
            whconsole.log(`From ${this.active_channel.name}, channel id: ${this.active_channel.id}, categories already exist, starting category selection`);
            if (this.category_select_active === true) {
                this.active_channel.send('Please wait, there is an on-going Trivia! <:NXcapoowave:646652140684836874>');
                this.send_category_message();
            } else {
                this.active_channel.send('Trivia time! <:NXcapoowave:646652140684836874>');
                this.select_category();
            }
        }
        return this;
    }

    select_category() {
        whconsole.log(`From ${this.active_channel.name}, channel id: ${this.active_channel.id}, category selection`);
        this.category_select_active = true;
        let temp_categories = this.categories;
        let random_categories = [];
        for (let i = 0; i < 4; i++) {
            let num = randInt(0, temp_categories.length - 1);
            random_categories.push(temp_categories[num]);
            temp_categories.splice(num, 1);
        }

        this.active_categories = random_categories;

        let msg = "*Choose a category:*\n"

        random_categories.forEach((category, index) => {
            msg += `**${choice_emoji[index]} ${category.name}**\n`;
        });

        this.send_category_message(msg);

    }

    send_category_message(msg) {
        whconsole.log(`From ${this.active_channel.name}, channel id: ${this.active_channel.id}, sending category message`);
        const filter = (reaction, user) => {
            let exists = choice_emoji.includes(reaction.emoji.name)
                && !user.bot //user.id !== client.user.id;
            return exists;
        }

        if (!msg) {
            msg = this.category_message.content;
            this.category_message.delete();
        }
        // send the message and add the reactions;
        this.active_channel.send(msg).then((message) => {
            whconsole.log(`From ${this.active_channel.name}, channel id: ${this.active_channel.id}, category message sent, message id: ${message.id}`);
            this.category_message = message;
            let emoji_index = 0;

            // Add reaction collector
            message.awaitReactions(filter, { max: 1 }).then(this.category_selected.bind(this))
                .catch(err => whconsole.log(err));

            message.react(choice_emoji[emoji_index]).then(() => {
                emoji_index++;
                message.react(choice_emoji[emoji_index]).then(() => {
                    emoji_index++;
                    message.react(choice_emoji[emoji_index]).then(() => {
                        emoji_index++;
                        message.react(choice_emoji[emoji_index]).then(() => {

                        });
                    })
                });
            });
        });
    }

    // Handle Trivia
    category_selected(collected) {
        let reaction = collected.first();
        let choice = choice_emoji.indexOf(reaction.emoji.name);
        let user = reaction.users.cache.last();
        whconsole.log(`From ${this.active_channel.name}, channel id: ${this.active_channel.id}, category selected by ${user.username}, user id: ${user.id}`);
        this.set_options_category(choice);
        this.ask();
        this.active_channel.send(`<@${user.id}>, you chose: **${this.active_categories[choice].name}**`);
        this.category_select_active = false;
    }

    set_options_category(choice) {
        this.options.category = this.active_categories[choice].id;
    }

    ask() {
        // Retrive questions
        whconsole.log(`From ${this.active_channel.name}, channel id: ${this.active_channel.id}, retrieving question`);
        axios.get('https://opentdb.com/api.php', { params: this.options }).then((res) => {
            whconsole.log(`**From ${this.active_channel.name}, channel id: ${this.active_channel.id}, question retrieved**`);
            if (res.data) {
                this.content = res.data.results;
            }
            this.start()
        }).catch(err => whconsole.log(err));
    }

    start() {
        whconsole.log(`From ${this.active_channel.name}, channel id: ${this.active_channel.id}, trivia start`);
        this.active = true;

        let qnum = randInt(0, this.content.length - 1); //Math.floor(Math.random() * this.content.length);
        let chosen_content = this.content[qnum];
        let q_text = decodeURIComponent(chosen_content.question);
        // whconsole.dir(chosen_content);

        this.answers = chosen_content.incorrect_answers;
        this.correct_answer_index = randInt(0, 3); //Math.floor(Math.random() * 4);
        this.answers.splice(this.correct_answer_index, 0, chosen_content.correct_answer);

        // whconsole.dir(this);

        // setTimeout(() => {
        let msg = `**The question is:** *${q_text.trim()}*\n`;
        this.answers.forEach((answer, index) => {
            msg += `**${choice_emoji[index]}  ${decodeURIComponent(answer).trim()}**\n`
        });

        this.send_question_message(msg);

        // remove question after use
        this.content.splice(qnum, 1);
        // }, 1000);
    }

    send_question_message(msg) {
        whconsole.log(`From ${this.active_channel.name}, channel id: ${this.active_channel.id}, sending trivia question`);
        const filter = (reaction, user) => {
            let exists = choice_emoji.includes(reaction.emoji.name)
                && !user.bot //user.id !== client.user.id;
            return exists;
        }

        if (!msg) {
            msg = this.message.content;
            this.message.delete();
        }

        this.active_channel.send(msg).then((message) => {
            whconsole.log(`From ${this.active_channel.name}, channel id: ${this.active_channel.id}, trivia question sent, message id: ${message.id}`);
            this.message = message;
            message.awaitReactions(filter, { max: 1 }).then(this.answer_selected.bind(this))
                .catch(err => whconsole.log(err));
            let emoji_index = 0;
            message.react(choice_emoji[emoji_index]).then(() => {
                emoji_index++;
                message.react(choice_emoji[emoji_index]).then(() => {
                    emoji_index++;
                    message.react(choice_emoji[emoji_index]).then(() => {
                        emoji_index++;
                        message.react(choice_emoji[emoji_index]).then(() => {
                        });
                    })
                });
            });
        });
    }

    answer_selected(collected) {
        let reaction = collected.first();
        let choice = choice_emoji.indexOf(reaction.emoji.name);
        let user = reaction.users.cache.last();
        whconsole.log(`From ${this.active_channel.name}, channel id: ${this.active_channel.id}, answer selected by ${user.username}, user id: ${user.id}`);
        if (choice === this.correct_answer_index) {
            this.active_channel.send(`Congratulations <@${user.id}>, you got it! <:NXcapoowave:646652140684836874> The correct answer is: **${decodeURIComponent(this.answers[this.correct_answer_index]).trim()}**`);
        } else {
            this.active_channel.send(`Nice try <@${user.id}>, but that was not the correct answer... <:NXcapoocry:646652140684574720> The correct answer is: **${decodeURIComponent(this.answers[this.correct_answer_index]).trim()}**`);
        }
        this.active = false;
    }
};

module.exports = {
    Trivia: Trivia
}
