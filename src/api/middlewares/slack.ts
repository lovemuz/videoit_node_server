const { createEventAdapter } = require('@slack/events-api');
const { WebClient } = require('@slack/web-api');
const { logger } = require('../../config/winston');

// Slack 토큰이 없으면 null로 설정 (개발 환경용)
const web = process.env.SLACK_BOT_TOKEN
  ? new WebClient(process.env.SLACK_BOT_TOKEN)
  : null;

if (!web) {
  logger.warn('SLACK_BOT_TOKEN not configured. Slack notifications will be disabled.');
}

export const slackPostMessage = async (channel: any, text: string) => {
  if (!web) {
    logger.warn(`Slack notification skipped (not configured): ${text}`);
    return;
  }
  return await web.chat.postMessage({ channel, text });
}
