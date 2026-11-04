"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import { BookingProvider } from "@/components/BookingContext";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#c9a7ff" },
    background: { default: "#1b1426", paper: "#251c35" },
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <BookingProvider>{children}</BookingProvider>
    </ThemeProvider>
  );
}
