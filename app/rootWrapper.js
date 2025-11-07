'use client';
// react
import { useMemo } from 'react';
// context
import { AuthContext } from '@/context/auth/authContext';
// api
import { Api } from '@/utils/api';

export default function ParentWrapper({ children }) {
    const { authFunc, authState, authDispatch } = Api();
    let authMemo = useMemo(() => {
        return {
            authFunc,
            authState,
            authDispatch,
        };
    }, [authFunc, authState, authDispatch]);

    return <AuthContext.Provider value={authMemo}>{children}</AuthContext.Provider>;
}
