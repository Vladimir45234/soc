import { Link } from "react-router-dom";
import classes from './navbar.module.css';

export default function Navbar(){
  return (
    <div className={classes.nav}>
        <Link to="/chats">
            <img src="/images/Group 51(2).svg" alt="Chats" />
        </Link>
        <Link to="/search">
            <img src="/images/Group 50(1).svg" alt="Search" />
        </Link>
        <Link to="/profile">
            <img src="/images/Group 52(1).svg" alt="Profile" />
        </Link>
    </div>
  );
};