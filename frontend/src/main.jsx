import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import DonorPage from "./DonorPage.jsx";

function Router() {
  const [page, setPage] = useState(window.location.hash);

  useEffect(() => {
    const handler = () => setPage(window.location.hash);
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  if (page === "#donor") return <DonorPage />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Router />);
