const axios = require('axios').default;
const whurl = `https:\/\/discordapp.com\/api\/webhooks\/648845040751345664\/uaYdETE1lhVxdi5SzmEQNoC3BkI3Lmx5_rcFq2vVl9RLsLPd9XtskMOJR-Dm5BE1NPBE`;

const RateLimit = (fn, delay, context) => {
    var queue = [], timer = null;
    function processQueue() {
        var item = queue.shift();
        if (item)
            fn.apply(item.context, item.arguments);
        if (queue.length === 0)
            clearInterval(timer), timer = null;
    }
    return function limited() {
        queue.push({
            context: context || this,
            arguments: [].slice.call(arguments)
        });
        if (!timer) {
            processQueue();  // start immediately on the first invocation
            timer = setInterval(processQueue, delay);
        }
    }
}

const postwh = (content) => {
    axios.post(whurl, {
        content: content
    }).then().catch(err => console.log(err));
}

class whconsole {
    static log() {
        let args = Array.prototype.slice.call(arguments);
        let content = args.join(' ');
        let LOG_PREFIX = new Date().getDate() + '.' + new Date().getMonth() + '.' + new Date().getFullYear() + ' / ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();

        let exec = RateLimit(postwh, 500);
        // exec(`**[${LOG_PREFIX}]** ${content}`);

        console.log.apply(console, args);
    }


}

module.exports = whconsole;