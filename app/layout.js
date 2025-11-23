import "./globals.css";
// THE FIX: AppProvider must be a named import (with curly braces).
import { AppProvider } from "./components/AppProvider"; 
import RootClientLayout from "./RootClientLayout";

// Metadata export is allowed here
export const metadata = {
  title: "Enfinito CRM",
  description: "Enfinito CRM Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="h-full">
        <AppProvider>
          <RootClientLayout>{children}</RootClientLayout>
        </AppProvider> 
      </body>
    </html>
  );
}