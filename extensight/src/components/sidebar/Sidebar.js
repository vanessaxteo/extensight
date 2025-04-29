import { List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import { Home, People, EventNote, Today, Settings, AutoAwesome} from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

const navItems = [
  { text: "Dashboard", icon: <Home />, path: "/" },
  { text: "Students", icon: <People />, path: "/students" },
  { text: "AI Suggestion", icon: <AutoAwesome/>, path: "/aisuggestion" },
  { text: "Assignments", icon: <EventNote />, path: "/assignments" },
  { text: "Calendar", icon: <Today />, path: "/calendar" },
  { text: "Settings", icon: <Settings />, path: "/settings" },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="sidebar sidebarPaper">
      <div className="sidebarHeader">
        <span className="logo">Extensight</span>
      </div>
      <List>
        {navItems.map(({ text, icon, path }) => {
          const selected = location.pathname === path;
          return (
            <ListItem
              button
              key={text}
              component={Link}
              to={path}
              className={`${selected ? "selected" : ""} navItem`}
            >
              <ListItemIcon className="navIcon">{icon}</ListItemIcon>
              <ListItemText primary={text} className="navText" />
            </ListItem>
          );
        })}
      </List>
    </div>
  );
}
