import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div style={{ display: "flex" }}>

      <Sidebar />

      <main
        style={{
          flex: 1,
          padding: "20px",
          marginLeft: "220px",
        }}
      >
        <Outlet />
      </main>

    </div>
  );
}