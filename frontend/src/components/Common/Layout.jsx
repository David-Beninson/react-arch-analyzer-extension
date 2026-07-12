import { Outlet } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";
import './Common.css'
export default function Layout() {
    return (
        <>
            <header>
                <Navbar />
            </header>
            <main className="content">
                <Outlet />
            </main>
            <footer>
                <Footer />
            </footer>
        </>
    );
}