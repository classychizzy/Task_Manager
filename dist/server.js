// main entry point
import App from './app.js';
import express, { request, response } from 'express';
const port = process.env.PORT || 8080;
const app = new App();
app.listen(Number(port));
app.app.get('/', (req, res) => {
    res.send('Hello World!');
});
//# sourceMappingURL=server.js.map