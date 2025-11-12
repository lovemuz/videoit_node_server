const { createEventAdapter } = require('@slack/events-api');
const { WebClient } = require('@slack/web-api');

const web = new WebClient(process.env.SLACK_BOT_TOKEN);


export const slackPostMessage = async (channel: any, text: string) => await web.chat.postMessage({ channel, text })
