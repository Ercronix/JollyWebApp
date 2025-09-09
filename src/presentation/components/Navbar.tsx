import { Link } from "@tanstack/react-router";

export function Navbar() {
    return (
        <>
            <div className="p-2 flex gap-2">
                <Link className=" hover:underline [&.active]:font-bold" to="/">
                    Home
                </Link>{' '}
                <Link to="/about" className="[&.active]:font-bold">
                    About
                </Link>
                <Link to="/lobby" className="[&.active]:font-bold">Lobby
                </Link>
            </div>
            <hr/>
        </>
    )
}