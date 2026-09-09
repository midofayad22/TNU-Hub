import { BrowserRouter } from "react-router-dom";

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
    </BrowserRouter>
  );
}

export default App;