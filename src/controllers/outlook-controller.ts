import axios from "axios";
import redisConnection from '../config/db';
import { Queue } from "bullmq";
import { readMailAndAssignLabel } from "../services/openai-service";
import cron from 'node-cron';
const OutlookQueue = new Queue("outlook-reply", { connection: redisConnection });

import { Request, Response } from 'express';
import serverConfig from "../config/serverConfig";

export const user: any = async (req: Request, res: Response) => {
    try {
        let userId = serverConfig.OUTLOOK_USER;
        let accessToken = await redisConnection.get(userId);
        const mails = await axios('https://graph.microsoft.com/v1.0/me/messages', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        console.log("This is response: ", mails.data.value[0].id);

        if (mails.data.value && mails.data.value.length > 0 && mails.data.value[0].bodyPreview) {
            let message = mails.data.value[0].bodyPreview.split("On")[0];
            const id = mails.data.value[0].id;
            const setOutlookIdInRedis = await redisConnection.set("outlookMessageId", id);
            console.log("Set outlookId in redis:", setOutlookIdInRedis);
            res.status(200).json({ message: mails.data.value[0].id });
        } else {
            res.status(200).json({ message: "No emails found or email body preview is missing" });
        }
    } catch (error: any) {
        console.error('Error details:', error.response ? error.response.data : error.message);
        res.status(400).json({ Error: "Error while getting outlook mail list" });
    }
}

export const read: any = async (userId: string, id: string, req: Request, res: Response) => {
    try {
        // Check if the message has already been processed
        // const processed = await redisConnection.get(`processed_outlookMessageId`);
        // if (processed) {
        //     console.log(`Message with ID ${id} has already been processed.`);
        //     return res.status(200).json({ Message: "Message already processed" });
        // }
        console.log("Email of read", userId, "MessageId:", id);
        let access_token = await redisConnection.get(userId);
        console.log("This is read access token: ", access_token);
        let accessToken = await redisConnection.get(userId);

        const mails = await axios(`https://graph.microsoft.com/v1.0/me/messages/${id}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        let message = mails.data;
        console.log("MESSAGE", message);

        if (message.bodyPreview && message.sender && message.sender.emailAddress && message.sender.emailAddress.address) {
            let content = message.bodyPreview.split("On")[0];
            let sender = message.sender.emailAddress.address;


            let label = await readMailAndAssignLabel(content);
            OutlookQueue.add("send reply", { label: label, sender: sender, accessToken: accessToken });


            // Mark the message as processed
            await redisConnection.set(`processed_outlookMessageId`, id);

            res.status(200).json({ message: "Email labelled. Reply scheduled" });
        } else {
            res.status(200).json({ message: "Email body preview or sender information is missing" });
        }
    } catch (error: any) {
        console.error('Error details:', error.response ? error.response.data : error.message);
        res.status(400).json({ Error: "Error while reading outlook mail" });
    }
}

cron.schedule("* * * * *", async () => {
    try {
        console.log("calling OUTLOOK: LISTEMAIL");
        const req = {
            params: { email: serverConfig.OUTLOOK_USER },
        };
        const res = {
                    status: (code: any) => ({
                      json: (data: any) => console.log(`Status: ${code}, Data: ${JSON.stringify(data)}`)
                    })
                  };
                  await user(req as unknown as Request , res as Response);
    } catch (error: any) {
        console.error("Error calling LISTEMAIL:");
        console.log(error.response ? error.response.data : error.message);
    }
});


cron.schedule("*/2 * * * *", async () => {
    try {
        console.log("calling OUTLOOK: READEMAIL");
        const id = await redisConnection.get('outlookMessageId');

        console.log("Id", id);

        const requestParams = {
            email: serverConfig.OUTLOOK_USER,
            messageId: id
        };

        const mockRes = {
            status: (code: any) => ({
                json: (data: any) => console.log(`Status: ${code}, Data: ${JSON.stringify(data)}`)
            })
        };

        await read(
            requestParams.email,
            requestParams.messageId,
            {} as Request,
            mockRes as Response
        );
        console.log("ReadMails", requestParams);
    } catch (error: any) {
        console.error("Error calling READEMAIL:");
        console.log(error.response ? error.response.data : error.message);
    }
});


