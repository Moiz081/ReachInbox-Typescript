import axios from 'axios';
import {Request,Response } from 'express';
import redisConnection from '../config/db';
import { Queue, Worker } from "bullmq";
import { readMailAndAssignLabel, readLabelAndReply } from "../services/openai-service";
import cron from 'node-cron';
const LabelQueue = new Queue("reply", redisConnection as any);
import serverConfig from '../config/serverConfig';

export const userInfo = async (req: Request, res: Response) => {
    try {
        let { userId } = req.params;
        let access_token = await redisConnection.get(userId)

        let response = await axios.get(`https://gmail.googleapis.com/gmail/v1/users/${userId}/profile`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${access_token}`
            }
        })

        res.status(200).json(response.data)
    } catch (error) {
        console.log(error)
        res.status(400).json({ Error: "Error while getting user data" })
    }
}

export const createLabel = async (req: Request, res: Response) => {
    try {
        let { userId } = req.params;
        let access_token = await redisConnection.get(userId)
        console.log(access_token);
        let labelContent = req.body
        console.log(labelContent);
        let response = await axios.post(`https://gmail.googleapis.com/gmail/v1/users/${userId}/labels`,
            labelContent,
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${access_token}`
                }
            });

        res.status(200).json(response.data)
    } catch (error: any) {
        console.log(error.response ? error.response.data : error.message);
        res.status(400).json({ 
            Error: "Error while creating new label",
            Details: error.response ? error.response.data : error.message
        });
    }
}


export const list = async (req: Request, res: Response) => {
    try {
    
        let userId: any = serverConfig.GMAIL_USER;
        let access_token = await redisConnection.get(userId)

        let response = await axios.get(`https://gmail.googleapis.com/gmail/v1/users/${userId}/messages?maxResults=5`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${access_token}`
            }
        })

        console.log("This is response: ",response.data);
        const id = response.data.messages[0].id;

        const setIdInRedis = await redisConnection.set("messageId",id);
        console.log("Set Id in redis:", setIdInRedis);

        res.status(200).json(response.data)
    } catch (error: any) { 
        console.log(error.response ? error.response.data : error.message);
        res.status(400).json({ 
            Error: "Error while getting gmail email list",
            Details: error.response ? error.response.data : error.message
        });
    }
}

export const read: any = async (userId: string, id: string, req: Request, res: Response) => {
    try {
        // Check if the message has already been processed
        // const processed = await redisConnection.get(`processed_MessageId`);
        // if (processed) {
        //     console.log(`Message with ID ${id} has already been processed.`);
        //     return res.status(200).json({ Message: "Message already processed" });
        // }
        console.log("Email of read", userId, "MessageId:", id);
        let access_token: any = await redisConnection.get(userId);
        console.log("This is read access token: ", access_token);
        let response = await axios.get(`https://gmail.googleapis.com/gmail/v1/users/${userId}/messages/${id}`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${access_token}`
            }
        })
        const fromHeaderValue = response.data.payload.headers.find((header: { name: string; }) => header.name === 'From').value;
        console.log(fromHeaderValue);
        let senderEmail = fromHeaderValue.match(/<([^>]+)>/)[1];
        console.log(senderEmail);
        if (senderEmail == userId) {
            senderEmail = response.data.payload.headers.find((header: { name: string; }) => header.name === 'To').value.match(/<([^>]+)>/)[1];
            console.log(senderEmail);
        }

        let label = await readMailAndAssignLabel(response.data)

        console.log(label);
        if (!label) return res.status(400).json({ Error: "Error while assigning label" });

        if (label == "Interested") { 
            await assignLabel("Label_2", userId, id, access_token);
            // await readLabelAndReply("Interested");
        }
        else if (label == "Not Interested") {
            await assignLabel("Label_3", userId, id, access_token);
            // await readLabelAndReply("Not Interested");
        }
        else if (label == "More Information") {
            await assignLabel("Label_1", userId, id, access_token);
            // await readLabelAndReply("More Information");
        }
        let jobData = {
            userId: userId,
            id: id,
            access_token: access_token,
            label: label,
            reply: response.data.snippet,
            sender: senderEmail
        }
        LabelQueue.add("Send Reply", jobData);
        console.log("job added to queue", jobData.label);

        // Mark the message as processed
        //await redisConnection.set(`processed_MessageId`, id);
        
        res.status(200).json({ Message: "Label assigned. Reply scheduled" })
    } catch (error: any) {
        console.log(error.response ? error.response.data : error.message);
        res.status(400).json({ 
            Error: "Error while reading message",
            Details: error.response ? error.response.data : error.message
        });
    }
}

export const lables = async (req: Request, res: Response) => {
    try {
        let { userId, id } = req.params

        let access_token = await redisConnection.get(userId)

        let response = await axios.get(`https://gmail.googleapis.com/gmail/v1/users/${userId}/labels`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${access_token}`
            }
        })
        console.log('Request body:', req.body);
        console.log('User ID:', userId);
        console.log('Message ID:', id);
        console.log('Access Token:', access_token);
        res.status(200).json(response.data)
    } catch (error: any) {
        console.error('Error details:', error.response ? error.response.data : error.message);
        res.status(400).json({ Error: "Error while getting labels list" })
    }
}


export const addLabel = async (req: Request, res: Response) => {
    try {
        let { userId, id } = req.params;

        let access_token = await redisConnection.get(userId);

        if (!access_token) {
            throw new Error('Access token not found for user');
        }

        console.log('Request body:', req.body);
        console.log('User ID:', userId);
        console.log('Message ID:', id);
        console.log('Access Token:', access_token);

        let response = await axios.post(`https://gmail.googleapis.com/gmail/v1/users/${userId}/messages/${id}/modify`,
            req.body,
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${access_token}`
                }
            }
        );
        console.log("This is axios response:", response.data);
        res.status(200).json(response.data);
    } catch (error: any) {
        console.error('Error details:', error.response ? error.response.data : error.message);
        res.status(400).json({ Error: "Error while adding label to message", details: error.response ? error.response.data : error.message });
    }
}

export async function assignLabel(label: string, userId: string, id: string, access_token: string) {
    try {
        let labelOptions = {
            "addLabelIds": [`${label}`]
        }
        await axios.post(`https://gmail.googleapis.com/gmail/v1/users/${userId}/messages/${id}/modify`, labelOptions, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${access_token}`
            }
        })
        return true;
    } catch (error) {
        return false;
    }
}

cron.schedule("* * * * *", async () => {
    try {
      console.log("calling GMAIL: LIST EMAIL");
      const req = {
        params: { email: serverConfig.GMAIL_USER },
      };
      const res = {
        status: (code: any) => ({
          json: (data: any) => console.log(`Status: ${code}, Data: ${JSON.stringify(data)}`)
        })
      };
      await list(req as unknown as Request , res as Response);
    } catch (error: any) {
      console.error("Error calling Gmail LIST of EMAILs:");
      console.log(error.response ? error.response.data : error.message);
    }
  });
  
  
  cron.schedule("*/2 * * * *", async () => {
    try {
        console.log("CALLING GMAIL: READ EMAIL");
        const id = await redisConnection.get('messageId');
    
        console.log("messageId", id);

        const requestParams = {
            email: serverConfig.GMAIL_USER,
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
        console.log("Reading Gmail EMails: ", requestParams);
    } catch (error: any) {
        console.error("Error calling Gmail READEMAIL:");
        console.log(error.response ? error.response.data : error.message);
    }
});

