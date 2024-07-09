import { PublicClientApplication, ConfidentialClientApplication } from '@azure/msal-node';
import AzureCredentials from '../config/serverConfig';
import axios from "axios";
import redisConnection from '../config/db';
import type { Request, Response } from 'express';

const config = {
    auth: {
        clientId: AzureCredentials.AZURE_CLIENT_ID,
        authority: 'https://login.microsoftonline.com/common',
        clientSecret: AzureCredentials.AZURE_CLIENT_SECRET,
        redirectUri: 'http://localhost:3000/api/v1/microsoft/auth/callback'
    },
};

const pca = new ConfidentialClientApplication(config);

export const outlookAuth = async (req: Request, res: Response) => {

    const authCodeUrlParameters = {
        scopes:['user.read','Mail.Read','Mail.Send'],
        redirectUri: 'http://localhost:3000/api/v1/microsoft/auth/callback',
      };
      
  try {
    // Get the authorization URL to redirect the user
    const authCodeUrl = await pca.getAuthCodeUrl(authCodeUrlParameters);
    res.redirect(authCodeUrl);
  } catch (error) {
    console.error('Error generating auth outlookAuth URL:', error);
    res.status(500).send('Error generating outlookAuth code URL');
  }
}

// Route to handle the callback after MS authentication
export const outlookAuthCallback = async (req: Request, res: Response) => {
  const tokenRequest: any = {
      code: req.query.code,
      scopes: ['user.read', 'Mail.Read', 'Mail.Send'],
      redirectUri: 'http://localhost:3000/api/v1/microsoft/auth/callback',
  };

  if (!tokenRequest.code) {
      return res.status(400).send('Authorization code is missing');
  }

  try {
      // Exchange the authorization code for an access token
      const response = await pca.acquireTokenByCode(tokenRequest);

      if (!response || !response.accessToken) {
          throw new Error('Access token is missing in the response');
      }

      const accessToken = response.accessToken;

      // Use the access token to make requests to MS Graph API or other protected resources
      const userProfile = await axios.get('https://graph.microsoft.com/v1.0/me', {
          headers: {
              Authorization: `Bearer ${accessToken}`,
          },
      });

      const userData = userProfile.data;

      await redisConnection.set(userData.mail, accessToken);
      const message = `${userData.mail} . User authenticated`;

      // Fetch user messages
      const userMessagesResponse = await axios.get('https://graph.microsoft.com/v1.0/me/messages', {
          headers: {
              Authorization: `Bearer ${accessToken}`,
          },
      });

      const userMessagesData = userMessagesResponse.data;

      if (userMessagesData && userMessagesData.value && userMessagesData.value.length > 0) {
          const messages = userMessagesData.value.map((msg: { subject: any; bodyPreview: any; }) => ({
              subject: msg.subject,
              bodyPreview: msg.bodyPreview || 'No preview available',
          }));
          res.status(200).json({ Message: message });
      } else {
          res.status(200).json({ Message: message, Messages: 'No messages found' });
      }
  } catch (error: any) {
      console.error('Error during token acquisition or MS Graph API call:', error.response?.data || error.message);

      // Logging the response data structure to debug the issue
      if (error.response && error.response.data) {
          console.error('Error response data:', JSON.stringify(error.response.data, null, 2));
      }

      res.status(500).send(error.response?.data || 'Internal Server Error');
  }
};

