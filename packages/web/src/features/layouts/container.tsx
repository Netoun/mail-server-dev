import { ComponentChildren } from "preact";
import { containerStyles } from "./container.css";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { mainStyles } from "./container.css";

export function Container({ children }: { children: ComponentChildren }) {
    return (
        <div class={containerStyles}>
            <Header />
            <Sidebar />
            <main class={mainStyles}>  
                {children}
            </main>
        </div>
    );
}