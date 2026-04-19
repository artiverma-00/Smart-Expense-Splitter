import { Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const manrope = Manrope({ subsets: ["latin"] });

export const metadata = {
  title: "Smart Expense Splitter",
  description: "Split expenses smartly with AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={manrope.className}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
