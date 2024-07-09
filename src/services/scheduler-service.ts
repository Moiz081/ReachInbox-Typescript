import { Worker } from "bullmq";
import { readLabelAndReply } from "./openai-service";
import { mailUser } from "./message-service";
import axios from "axios";

const workerOptions: any = {
    connection: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
    },
};

const initializeWorkers = async () => {
    try {
        // Initialize reply worker
        console.log("Initializing sendReplyWorker...");
        const sendReplyWorker = new Worker("reply", async (job: any) => {
            console.log("sendReplyWorker: Processing job");
            try {
                let reply: any = await readLabelAndReply(job.data.label);
                console.log("sendReplyWorker: Reply received", reply);
                let subject = reply[0].replace("Subject: ", "");
                let content = reply[1].replace(": ", "");
                let sender = job.data.userId;
                let recipient = job.data.sender;
                console.log("sendReplyWorker: Recipient", recipient);
                let rawMessage: any = mailUser(sender, recipient, subject, content);
                console.log("sendReplyWorker: Raw message", rawMessage);

                let response = await axios.post(`https://gmail.googleapis.com/gmail/v1/users/${sender}/messages/send`, { raw: rawMessage }, {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${job.data.access_token}`
                    }
                });
                console.log("sendReplyWorker: API Response", response.data);
            } catch (error: any) {
                console.log("sendReplyWorker: Error", error.response ? error.response.data : error.message);
            }
        }, workerOptions);

        sendReplyWorker.on("completed", (job: any) => {
            console.log(`sendReplyWorker: Job ${job.name} completed`);
        });

        sendReplyWorker.on("failed", (job: any) => {
            console.log(`sendReplyWorker: Job ${job.name} failed`);
        });

    
        console.log("sendReplyWorker is ready");

        // Initialize outlook-reply worker
        console.log("Initializing OutlookReply...");
        const OutlookReply = new Worker("outlook-reply", async (job) => {
            console.log("OutlookReply: Processing job");
            try {
                let reply: any = await readLabelAndReply(job.data.label);
                console.log("OutlookReply: Reply received", reply);
                let subject = reply[0].replace("Subject: ", "");
                let content = reply[1].replace(": ", "");
                let recipient = job.data.sender;
                console.log("hehe",recipient)

                let message = {
                    "message": {
                        "subject": subject,
                        "body": {
                            "contentType": "Text",
                            "content": content
                        },
                        "toRecipients": [
                            {
                                "emailAddress": {
                                    "address": recipient
                                }
                            }
                        ]
                    },
                    "saveToSentItems": false
                };

                let response = await axios.post("https://graph.microsoft.com/v1.0/me/sendMail", message, {
                    headers: {
                        Authorization: `Bearer ${job.data.accessToken}`,
                    }
                });
                console.log("OutlookReply: API Response", response);
            } catch (error: any) {
                console.log("OutlookReply: Error", error.response ? error.response.data : error.message);
            }
        }, workerOptions);

        OutlookReply.on("completed", (job: any) => {
            console.log(`OutlookReply: Job ${job.name} completed`);
        });

        OutlookReply.on("failed", (job: any) => {
            console.log(`OutlookReply: Job ${job.name} failed`);
        });

        console.log("OutlookReply is ready");

        console.log("Workers have been initialized.");
    } catch (err) {
        console.error("Error initializing workers:", err);
    }
};

// Initialize workers
initializeWorkers();
