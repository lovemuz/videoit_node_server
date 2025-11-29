import { logger } from "../../config/winston";
const admin = require("firebase-admin");
//const serviceAccount = require("../../../videoit-9c7f0-firebase-adminsdk-fbsvc-327ea9fc92.json");
const serviceAccount = require("../../../videoit-9c7f0-8c067f9a2cb9.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const FCMPushNotification = (
  title: string,
  body: string,
  token: string,
  image?: string,
  navigation?: any
) => {
  if (!token) return;
  let message;
  /*
    if (navigation?.screen === 'Call') {
        message = {
            token: token,
            data: {
                screen: navigation?.screen as string || '',
                RoomId: navigation?.RoomId as string || '',
                PostId: navigation?.PostId as string || '',
                YouId: navigation?.YouId as string || '',
                you: navigation?.you as string || '',
                vip: navigation?.vip as string || '',
                callTime: navigation?.callTime as string || '',
            },
        }
    }
    else*/ if (image) {
    message = {
      token: token,
      data: {
        screen: (navigation?.screen as string) || "",
        RoomId: (navigation?.RoomId as string) || "",
        PostId: (navigation?.PostId as string) || "",
        YouId: (navigation?.YouId as string) || "",
        you: (navigation?.you as string) || "",
        vip: (navigation?.vip as string) || "",
        callTime: (navigation?.callTime as string) || "",
      },
      notification: {
        title: title,
        body: body,
      },
      android: {
        notification: {
          title: title,
          body: body,
          channel_id: process.env.CHANNEL_ID as string,
          priority: "high",
          imageUrl: image,
        },
        priority: "high",
      },
      apns: {
        headers: {
          "apns-priority": "5",
        },
        payload: {
          aps: {
            "mutable-content": "1",
          },
          urlImageString: image,
        },
        fcm_options: {
          image: image,
        },
      },
    };
  } else {
    message = {
      token: token,
      data: {
        screen: (navigation?.screen as string) || "",
        RoomId: (navigation?.RoomId as string) || "",
        PostId: (navigation?.PostId as string) || "",
        YouId: (navigation?.YouId as string) || "",
        you: (navigation?.you as string) || "",
        vip: (navigation?.vip as string) || "",
        callTime: (navigation?.callTime as string) || "",
      },
      notification: {
        title: title,
        body: body,
      },
      android: {
        notification: {
          title: title,
          body: body,
          channel_id: process.env.CHANNEL_ID as string,
          priority: "high",
        },
      },
      apns: {
        payload: {
          aps: {
            contentAvailable: true,
          },
        },
        headers: {
          "apns-push-type": "background",
          "apns-priority": "5",
          "apns-topic": "com.traveler.nmoment", // your app bundle identifier
        },
      },
      /*
          apns: {
              headers: {
                  'apns-priority': '5',
              },
              payload: {
                  aps: {
                      sound: 'default',
                      // contentAvailable: 1,
                      'content-available': 1,
                  }
              }
          },
          */
    };
  }

  try {
    admin
      .messaging()
      .send(message)
      .then((response: any) => {
        // Response is a message ID string.
        logger.info("Successfully sent message:", response);
      })
      .catch((error: any) => {
        logger.log("Error sending message:", error);
      });
  } catch (err) {
    logger.error(err);
  }
};

export { FCMPushNotification };
