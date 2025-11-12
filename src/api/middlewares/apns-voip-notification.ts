import fs from 'fs';
import http2 from 'http2';
import jwt from 'jsonwebtoken';
import path from 'path';

import { logger } from '../../config/winston'

// APNs 환경설정
const APNS_KEY_FILE = path.join(process.cwd(), 'APNS_KEY.p8'); // p8 키 파일 경로
const APNS_TEAM_ID = process.env.APNS_TEAM_ID ?? 'TEAM_ID';
const APNS_KEY_ID = process.env.APNS_KEY_ID ?? 'KEY_ID';
const APNS_BUNDLE_ID = process.env.APNS_BUNDLE_ID ?? 'com.example.bundleid';
const APNS_USE_SANDBOX = process.env.DEV_MODE !== 'production'; // 개발 모드 앱에서는 sandbox URL 사용해야 함
//const APNS_USE_SANDBOX = process.env.DEV_MODE !== 'production'; // 정답 코드

// APNs 서버 URL
const PROD_URL = 'api.push.apple.com';
const DEV_URL = 'api.development.push.apple.com';

export class APNSIdentity {
    constructor(public privateKey: string,
        public teamId: string,
        public keyId: string,
        public bundleId: string) {
    }

    /**
     * ES256 알고리즘으로 JWT 생성
     * Header에 kid(Key ID), alg(ES256) 설정
     */
    generateJwtToken() {
        const now = Math.floor(Date.now() / 1000); // seconds

        return jwt.sign(
            {
                iss: this.teamId,
                iat: now,
            },
            this.privateKey,
            {
                algorithm: 'ES256',
                header: {
                    kid: this.keyId,
                    alg: 'ES256',
                },
            }
        );
    }
}

export class APNS {
    private static _instance: APNS | null = null;
    private baseUrl: string;

    /**
     * 싱글턴 인스턴스
     */
    public static get shared(): APNS {
        if (!APNS._instance) {
            const privateKey = fs.readFileSync(APNS_KEY_FILE, 'utf8');
            const identity = new APNSIdentity(
                privateKey,
                APNS_TEAM_ID,
                APNS_KEY_ID,
                APNS_BUNDLE_ID,
            );

            APNS._instance = new APNS(
                identity,
                APNS_USE_SANDBOX,
            );
        }
        return APNS._instance;
    }

    constructor(private identity: APNSIdentity, private sandbox: boolean = false) {
        this.baseUrl = sandbox ? DEV_URL : PROD_URL;
    }

    /**
     * VoIP 알림을 전송합니다.
     */
    sendVoIPNotification(userInfo: Record<string, any> = {}, deviceTokens: string[]) {
        const payload = {
            aps: {
                alert: {
                    title: "Incoming VoIP Call",
                },
            },
            ...userInfo,
        };

        return this.sendPush(payload, deviceTokens);
    }

    /**
     * 실제 APNs 서버에 HTTP/2 POST 요청을 보내는 부분
     */
    async sendPush(payload: Record<string, any>, deviceTokens: string[]) {
        const jwtToken = this.identity.generateJwtToken();

        // Node의 http2 모듈로 APNs HTTP/2 세션 생성
        const client = http2.connect(`https://${this.baseUrl}`, {});

        // 각 토큰별로 요청
        for (const token of deviceTokens) {
            await new Promise<void>((resolve, reject) => {
                const req = client.request({
                    ':method': 'POST',
                    ':path': `/3/device/${token}`,
                    'authorization': `bearer ${jwtToken}`,
                    'apns-topic': this.identity.bundleId + '.voip',
                    'apns-push-type': 'voip',
                    'apns-priority': '10',
                    // 'apns-expiration': '0',
                });

                req.setEncoding('utf8');

                req.on('response', (headers, flags) => {
                });

                let responseData = '';
                req.on('data', (chunk) => {
                    responseData += chunk;
                });

                req.on('end', () => {
                    resolve();
                });

                req.on('error', (err) => {
                    reject(err);
                });

                // payload 전송
                req.write(JSON.stringify(payload));
                req.end();
            });
        }

        // 모든 토큰 전송 후 세션 종료
        client.close();
    }
}
