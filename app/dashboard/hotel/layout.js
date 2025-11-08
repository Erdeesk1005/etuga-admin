'use client';
import { Suspense } from 'react';

export default function RootLayout({ children }) {
    return <Suspense fallback={<>...</>}>{children}</Suspense>;
}
