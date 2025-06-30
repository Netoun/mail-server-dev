import { homePageStyles } from "./home-page.css";

export function Home() {
	return (
		<div class={homePageStyles} >
            <h1>Welcome to the Mail Server</h1>
            <p>
                This is a simple app that allows you to send and receive emails.
            </p>
            <p>
                It is built with Rust, Preact and Vite.
            </p>
		</div>
	);
}

