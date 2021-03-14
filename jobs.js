const fs = require('fs');
const cron = require('cron');
const whconsole = require('./whconsole');

let config_file = fs.readFileSync('config.json');
let config = JSON.parse(config_file);

let data_file = fs.readFileSync('data.json');
let data = JSON.parse(data_file);

// seconds, minute, hour, day of month, month, day of week

let job_list = [];
let job = cron.job('0 0 * * *', () => {
    data.wotd.downloaded = false;
    fs.writeFileSync('data.json', JSON.stringify(data));
    whconsole.log('Word of the day downloaded state is reset!');
});

whconsole.log(job.nextDates(5).map(date => date.toString()));
const scheduleJobs = () => {
    job.start();
}

module.exports = {
    scheduleJobs: scheduleJobs
}
