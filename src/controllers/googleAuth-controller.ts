import GoogleCredentials from '../config/serverConfig';
import { OAuth2Client } from 'google-auth-library';
import type { Request, Response } from 'express';
import { google } from "googleapis";
import axios from "axios";
import redisConnection from '../config/db';

const oAuth2Client = new OAuth2Client({
    clientId: GoogleCredentials.GOOGLE_CLIENTID,
    clientSecret: GoogleCredentials.GOOGLE_CLIENTSECRET,
    redirectUri: GoogleCredentials.GOOGLE_REDIRECTURI
});

export const googleAuth = async (req: Request, res: Response): Promise<void> => {
    
    const scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://mail.google.com/",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.compose",
    "https://www.googleapis.com/auth/gmail.insert",
    "https://www.googleapis.com/auth/gmail.labels",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email"
    ]
    
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope:scopes
    });
    res.redirect(authUrl);
}


export const googleAuthCallback = async (req: Request, res: Response): Promise<void> => {
    const {code} = req.query;
    console.log(code);
    try {
        const { tokens } = await oAuth2Client.getToken(code as string);
        const accessToken: any = tokens.access_token;
        const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        const userEmail = userInfoResponse.data.email;
        console.log('User Email:', userEmail);
        await redisConnection.set(userEmail,accessToken)
        const message = `${userEmail} Authenticated`
        res.status(200).json({Message:message})
    } catch (error) {
        console.log(error);
        res.send("Error during authentication")
    }
}

