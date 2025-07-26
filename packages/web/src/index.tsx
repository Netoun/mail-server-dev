import { render } from 'preact';
import { LocationProvider, Router, Route } from 'preact-iso';

import { Home } from './features/home/pages/home-page';
import { NotFound } from './features/errors/404-page';
import './style.css';
import { Container } from './features/layouts/container';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { themeClass } from './lib/theme.css';

import './lib/theme.css.ts';
import { MailDetails } from './features/mails/pages/mails-details';
import { useEffect } from 'preact/hooks';
import { useThemeStore } from './lib/theme-store';

const queryClient = new QueryClient();

function ThemeEffect() {
    const { resolvedTheme } = useThemeStore();
    useEffect(() => {
        const app = document.querySelector('#app');
        if (!app) return;
        app.classList.remove('light', 'dark');
        app.classList.add(themeClass);
        app.classList.add(resolvedTheme);
    }, [resolvedTheme]);
    return null;
}

export function App() {
	return (
        <QueryClientProvider client={queryClient}>
            <ThemeEffect />
		<LocationProvider>
			<Container>
                <Router>
                    <Route path="/" component={Home} />
                    <Route path="/mail/:id" component={MailDetails} />
                    <Route default component={NotFound} />
                </Router>
			</Container>
		</LocationProvider>
        </QueryClientProvider>
	);
}

render(<App />, document.getElementById('app'));
