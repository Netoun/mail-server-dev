import { notfoundRoot, notfoundContent, notfoundTitle, notfoundMessage, notfoundHomeBtn } from './404-page.css';

export function NotFound() {
	return (
		<main class={notfoundRoot}>
			<section class={notfoundContent} aria-labelledby="notfound-title">
				<h1 id="notfound-title" class={notfoundTitle}>404</h1>
				<p class={notfoundMessage}>Sorry, this page could not be found.</p>
				<a href="/" class={notfoundHomeBtn}>Return to homepage</a>
			</section>
		</main>
	);
}
