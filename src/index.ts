import express from 'express';
import bodyParser from 'body-parser';
import ApiRoutes from './routes/index';
import serverConfig from './config/serverConfig';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', ApiRoutes);
const PORT = serverConfig.PORT || 3000;

app.listen(PORT, async () => {
    console.log("Server started at PORT:", PORT);
});