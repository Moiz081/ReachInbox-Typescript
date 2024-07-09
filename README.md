# ReachInbox
- The task was to create a server-based application using Node.js and Express that can parse and analyze emails from both Google and Outlook accounts, and respond to these emails based on their context using AI. The application will incorporate several packages, including OpenAI for AI functionalities, Google APIs for accessing Google email data, Axios for making HTTP requests, and BullMQ for task scheduling and queue processing.

### Installation setup

- Clone the repository to your local machine
  `git clone https://github.com/Moiz081/ReachInbox.git`
  
- Run `npm install` to install all the dependencies.
- Run `npm run build` to compile Typescript into Javascript.
- Run `npm start` to boot the server.
- Run `npm run scheduler` to execute the scheduler-service.ts
- Create a `.env` file in the root directory with the same IDs as specified in the documentation.

### Running the server
- To start the server, run the following command in your terminal
  `npm start`
  
- To start the scheduler-service.ts file, run the following command in your terminal
  `npm run scheduler`
### File Structure
```
src/
├── config/
│   ├── db.ts
│   └── serverConfig.ts
├── controller/
│   ├── gmail-controller.ts
│   ├── googleAuth-controller.ts
│   ├── outlook-controller.ts
│   └── microsoftAuth-controller.ts
├── routes/
│   ├── v1/
│   │   └── index.ts
│   └── index.ts
├── services/
│   ├── message-service.ts
│   ├── openai-service.ts
│   └── scheduler-service.ts
└── index.ts
```

### API Endpoints
```
- GET /google/auth
- GET /google/auth/callback
```
```
- GET /userInfo/:userId
- POST /gmail/createLabel/:userId
- GET /gmail/list/:userId
- GET /gmail/read/:userId/messages/:id
- GET /gmail/labels/:userId
- POST /gmail/addLabel/:userId/messages/:id
```
```
- GET /outlook/list/:userId
- GET /outlook/read/:userId/:messageId
```
```
http://localhost:{PORT}/api/v1/{API_ENDPOINT}
```

### Video Walkthrough

https://drive.google.com/file/d/1EcNE2nbSzoJLHRQpLveKm4BAza6gsRnm/view?usp=drivesdk

