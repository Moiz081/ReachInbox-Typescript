import express from 'express';
const router = express.Router();

import * as GoogleAuthController from '../../controllers/googleAuth-controller';
import * as MicrosoftAuthController from '../../controllers/microsoftAuth-controller';
import * as GmailController from '../../controllers/gmail-controller';
import * as OutlookController from '../../controllers/outlook-controller';

router.get('/google/auth', GoogleAuthController.googleAuth);
router.get('/google/auth/callback', GoogleAuthController.googleAuthCallback);

router.get('/microsoft/auth', MicrosoftAuthController.outlookAuth);
router.get('/microsoft/auth/callback', MicrosoftAuthController.outlookAuthCallback);

router.get('/gmail/userInfo/:userId', GmailController.userInfo);
router.post('/gmail/createLabel/:userId', GmailController.createLabel);
router.get('/gmail/list/:userId', GmailController.list);
router.get('/gmail/read/:userId/messages/:id', GmailController.read);
router.get('/gmail/labels/:userId', GmailController.lables);
router.post('/gmail/addLabel/:userId/messages/:id', GmailController.addLabel);

router.get('/outlook/list/:userId', OutlookController.user);
router.get('/outlook/read/:userId/:messageId', OutlookController.read);

export default router;