import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes } from "react-router";
import routes from "./Routes";
import ContextWrapper from "./Context_Api/ContextProvider";

createRoot(document.getElementById("root")!).render(
  <ContextWrapper>
    <BrowserRouter>
      <Routes>{routes}</Routes>
    </BrowserRouter>
  </ContextWrapper>
);
