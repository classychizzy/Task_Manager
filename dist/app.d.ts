import express from 'express';
declare class App {
    app: express.Application;
    port: number;
    constructor();
    private initializeMiddlewares;
    listen(port: number): void;
}
export default App;
//# sourceMappingURL=app.d.ts.map