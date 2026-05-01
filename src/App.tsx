import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import { ThemeProvider } from "./components/theme-provider";

export default function App() {
  return (
    <Router>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rex" element={<Admin />} />
        </Routes>
        <Toaster richColors position="top-center" />
      </ThemeProvider>
    </Router>
  );
}
