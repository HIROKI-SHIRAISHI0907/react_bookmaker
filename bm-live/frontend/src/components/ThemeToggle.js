import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Moon, Sun } from "lucide-react";
export default function ThemeToggle() {
    const [theme, setTheme] = useState("light");
    useEffect(() => {
        // Check for saved theme preference or default to light
        const savedTheme = localStorage.getItem("theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
        setTheme(initialTheme);
        updateTheme(initialTheme);
    }, []);
    const updateTheme = (newTheme) => {
        if (newTheme === "dark") {
            document.documentElement.classList.add("dark");
        }
        else {
            document.documentElement.classList.remove("dark");
        }
        localStorage.setItem("theme", newTheme);
    };
    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        updateTheme(newTheme);
    };
    return (_jsxs(Button, { variant: "outline", size: "icon", onClick: toggleTheme, "data-testid": "button-theme-toggle", className: "hover-elevate", children: [theme === "light" ? _jsx(Moon, { className: "h-4 w-4" }) : _jsx(Sun, { className: "h-4 w-4" }), _jsx("span", { className: "sr-only", children: "Toggle theme" })] }));
}
