import dotenv from 'dotenv';
dotenv.config();

export default {
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,
    GOOGLE_CLIENTID: process.env.GOOGLE_CLIENTID as string,
    GOOGLE_CLIENTSECRET: process.env.GOOGLE_CLIENTSECRET as string,
    GOOGLE_REDIRECTURI: process.env.GOOGLE_REDIRECTURI as string,
    AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID as string,
    AZURE_CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET as string,
    OPENAI_APIKEY: process.env.OPENAI_APIKEY as string | undefined,
    REDIS_HOST: process.env.REDIS_HOST as string,
    REDIS_PORT: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : undefined,
    GMAIL_USER: process.env.GMAIL_USER as string,
    OUTLOOK_USER: process.env.OUTLOOK_USER as string
};
