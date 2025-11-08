'use client';
// react
import { useEffect } from 'react';
// next
import { useRouter } from 'next/navigation';
const page = () => {
    const router = useRouter();

    useEffect(() => {
        router.replace('/login');
    }, []);
    return '';
};

export default page;
