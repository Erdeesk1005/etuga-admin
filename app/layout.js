import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import RootWrapper from './rootWrapper';
const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata = {
    title: 'ETUGA',
    description: 'Admin Panel',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body suppressHydrationWarning={true}>
                <RootWrapper>{children}</RootWrapper>
            </body>
        </html>
    );
}
