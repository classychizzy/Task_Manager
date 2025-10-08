//main app file
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
class App {
    app;
    port;
    constructor() {
        this.app = express();
        this.port = Number(process.env.PORT) || 8080;
        this.initializeMiddlewares();
        //this.initializeControllers();
    }
    initializeMiddlewares() {
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(cors());
    }
    // private initializeControllers() {
    //     this.app.use('/api', controllers);
    // }    
    listen(port) {
        this.app.listen(this.port, () => {
            console.log(`Server is running on http://localhost:${this.port}`);
        });
    }
}
export default App;
//# sourceMappingURL=app.js.map