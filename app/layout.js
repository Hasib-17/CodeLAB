import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import ExamProvider from "@/components/shared/ExamContext";

export const metadata = {
  title: "CodeLab - Your Coding Ground",
  description: "Best Coding platform for all your needs",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ExamProvider>
          <Navbar />
          {children}
          <Footer />
        </ExamProvider>
      </body>
    </html>
  );
}
