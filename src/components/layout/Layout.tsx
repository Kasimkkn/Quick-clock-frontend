
import { ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useAuth } from "@/context/AuthContext";

const Layout = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex flex-1">
        {isAuthenticated && <Sidebar />}
        <main className={`flex-1 ${isAuthenticated ? "md:pl-[85px]" : ""} py-4 px-4 overflow-auto`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
