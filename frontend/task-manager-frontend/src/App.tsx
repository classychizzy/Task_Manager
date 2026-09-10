import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/index";
// import { useEffect } from "react";
// import { checkBackendHealth } from "./api/testapi";

function App() {

  console.log('loading pages')
  return (
    <BrowserRouter>

      <AppRoutes />

    </BrowserRouter>
  );
}

export default App;