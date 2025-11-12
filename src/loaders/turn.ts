import { CronJob } from 'cron'
import axios from 'axios'
import path from 'path'
import fs from 'fs'
import Turn from 'node-turn';

export default async () => {
    const turnServer = new Turn({
        // set options
        authMech: 'long-term',
        credentials: {
            username: process.env.TURN_USERNAME as string
        }
    });
    turnServer.start();
}

