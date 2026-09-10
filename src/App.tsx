import { BrowserRouter } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

import AppLayout from "./components/layout/AppLayout";
import MobileNav from "./components/layout/MobileNav";
import AppRoutes from "./routes/AppRoutes";

import { ProfileProvider } from "./context/ProfileProvider";
import { ThemeProvider } from "./context/ThemeProvider";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ProfileProvider>

          <AppLayout>
            <AppRoutes />
          </AppLayout>

          <MobileNav />

        </ProfileProvider>
      </ThemeProvider>
      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  );
}

export default App;
