import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Icon from "./Icon";

// NavLink adds aria-current="page" to the link of the open screen; the CSS underlines it.
const NAV_ITEMS = [
  { to: "/jobs", full: "Jobs", short: "Jobs", icon: "list" },
  { to: "/suggested", full: "Suggested", short: "Suggested", icon: "cards" },
  { to: "/resume", full: "My resume", short: "Resume", icon: "file" },
  { to: "/tailored", full: "Tailored CVs", short: "Tailored", icon: "hang" },
  { to: "/profile", full: "Search profile", short: "Profile", icon: "sliders" },
];

function initialsOf(name) {
  const words = name.split(/[\s@._-]+/);
  let initials = "";
  for (const word of words) {
    if (word !== "" && initials.length < 2) {
      initials += word[0].toUpperCase();
    }
  }
  return initials;
}

export default function AppNav() {
  const auth = useAuth();

  return (
    <nav className="appnav" aria-label="Jora">
      <Link className="logo" to="/jobs">jora<span>.</span></Link>
      {NAV_ITEMS.map(function (item) {
        return (
          <NavLink key={item.to} to={item.to}>
            <Icon name={item.icon} />
            <span className="full">{item.full}</span>
            <span className="short">{item.short}</span>
          </NavLink>
        );
      })}
      <div className="me">
        <span className="name">{auth.name}</span>
        <span className="avatar" aria-hidden="true">{initialsOf(auth.name)}</span>
        <button className="btn quiet" type="button" onClick={auth.logOut}>Log out</button>
      </div>
    </nav>
  );
}
