/**
 * Die `Layout`-Komponente definiert das Hauptlayout der Anwendung, einschließlich Header, Sidebar und Hauptinhalt.
 * @Author Farah. 
 */

import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div>
      {/* <!-- ===== Page Wrapper Start ===== --> */}
      <div className="flex h-screen overflow-hidden bg-meta-2">
        {/* <!-- ===== Sidebar Start ===== --> */}
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        {/* <!-- ===== Sidebar End ===== --> */}

        {/* <!-- ===== Content Area Start ===== --> */}
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden bg-[#F8F8F8]">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

          {/* <!-- ===== Main Content Start ===== --> */}
          <main className=" relative">
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10  ">
              <Outlet />
            </div>
          </main>
          {/* <!-- ===== Main Content End ===== --> */}
        </div>
        {/* <!-- ===== Content Area End ===== --> */}
      </div>
      {/* <!-- ===== Page Wrapper End ===== --> */}
    </div>
  );
}

export default Layout;
