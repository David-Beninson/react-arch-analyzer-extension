import { useState } from "react";
import { NavLink } from "react-router-dom";

export default function Header() {
    const [links] = useState(() => ["Home", "NewProject", "Dashboard"]);

    function roots() {
        return links.map((link) => {
            return (
                <span key={link}>
                    <NavLink to={link === "Home" ? "/" : `/${link.toLowerCase()}`}>
                        {link}
                    </NavLink>
                    &nbsp;
                </span>
            )
        })
    }
    return (
        <nav className="navbar">
            <div className="linksContainer">
                {roots()}
            </div>
        </nav>
    );
}