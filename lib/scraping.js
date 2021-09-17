const fs = require('fs');
const axios = require('axios').default;
const cheerio = require('cheerio');
const { htmlToText } = require('html-to-text');

let config_file = fs.readFileSync('config.json');
let config = JSON.parse(config_file);

let data_file = fs.readFileSync('data.json');
let data = JSON.parse(data_file);

let cnwotd = (params, message, callback) => {
	axios.get('https://feeds.feedblitz.com/mandarin-chinese-word-of-the-day&x=1').then((res) => {	
		console.log('fetched mandarin wotd!');
		let body = res.data;		
        const $ = cheerio.load(body, {xmlMode:true});
		$('title').each((i, elem) => {
			message.channel.send($(elem).text());
		});

		const $d = cheerio.load($('description').text());
		message.channel.send($d('table').text());
	});
};

module.exports = {
	cnwotd: cnwotd
};