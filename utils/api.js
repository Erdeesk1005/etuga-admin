// react
import { useEffect, useMemo, useReducer } from 'react';
// next
import { useRouter } from 'next/navigation';
// reducer
import AuthReducer from '@/context/auth/authReducer';
// axios
import axios from 'axios';
// utils
import { getcookie, removeCookie, setcookie } from '@/context/auth/utils';
// third
import { BASE_URL } from '@/utils/config';

export const Api = () => {
    const router = useRouter();
    const initialState = {
        userToken: null, // user token
        isLoggedIn: false, // user loggedin
    };
    const [state, dispatch] = useReducer(AuthReducer, initialState);

    useEffect(() => {
        let result = getcookie();
        if (result) {
            dispatch({ type: 'SIGN_IN', payload: result });
        } else {
            removeCookie();
            handlers.logOut();
            router.replace('/login');
        }
    }, []);

    const handlers = useMemo(
        () => ({
            setUser: async (data) => {
                setcookie(data?.data?.access_token);
                dispatch({ type: 'SIGN_IN', payload: data?.data?.access_token });
            },

            //хэрэглэгч гарах
            logOut: () => {
                removeCookie();
                dispatch({ type: 'SIGN_OUT' });
                router.replace('/login');
            },
            stateDynamicUpdate: (obj) => {
                //   payload = {
                //    type:obj.type
                //    value:obj.value
                //  }
                dispatch({ type: 'DYNAMIC_UPDATE', payload: obj });
            },

            //Basic dGVzdDoy
            GET: async (url, isToken = false, contentType = 'application/json', responseType = 'json') => {
                try {
                    const controller = new AbortController();
                    let payload = {
                        type: 'controller',
                        value: controller,
                    };
                    dispatch({ type: 'DYNAMIC_UPDATE', payload });
                    let response = await axios.get(`${BASE_URL}${url}`, {
                        headers: {
                            'Content-Type': contentType,
                            Authorization: isToken ? `Bearer ${state.userToken}` : '',
                        },
                        data: {},
                        signal: controller.signal,
                        responseType,
                    });
                    return response;
                } catch (e) {
                    if (e?.response?.status === 401) {
                        handlers.logOut();
                    }
                    return e;
                }
            },

            POST: async (url, data, contentType = 'application/json', responseType = 'json') => {
                try {
                    const controller = new AbortController();
                    let payload = {
                        type: 'controller',
                        value: controller,
                    };
                    dispatch({ type: 'DYNAMIC_UPDATE', payload });
                    let response = await axios.post(`${BASE_URL}${url}`, data, {
                        headers: {
                            'Content-Type': contentType,
                            Authorization: `Bearer ${state.userToken}`,
                        },
                        signal: controller.signal,
                        responseType,
                    });

                    return response;
                } catch (e) {
                    if (e?.response?.status === 401) {
                        handlers.logOut();
                    }
                    return e?.response?.data;
                }
            },
            POSTAUTH: async (url, isToken = false, data, contentType = 'application/json', responseType = 'json') => {
                try {
                    const controller = new AbortController();
                    let payload = {
                        type: 'controller',
                        value: controller,
                    };
                    dispatch({ type: 'DYNAMIC_UPDATE', payload });
                    let response = await axios.post(`${BASE_URL}${url}`, data, {
                        headers: {
                            'Content-Type': contentType,
                            Authorization: isToken ? `Bearer ${state.userToken}` : '',
                        },
                        signal: controller.signal,
                        responseType,
                    });

                    return response;
                } catch (e) {
                    if (e?.response?.status === 401) {
                        handlers.logOut();
                    }
                    return e?.response?.data;
                }
            },
            PUT: async (url, data, contentType = 'application/json', responseType = 'json') => {
                try {
                    let response = await axios.put(`${BASE_URL}${url}`, data, {
                        headers: {
                            Authorization: `Bearer ${state.userToken}`,
                            'Content-Type': contentType,
                        },
                        responseType,
                    });

                    return response;
                } catch (e) {
                    if (e?.response?.status === 401) {
                        handlers.logOut();
                    }
                    return e?.response?.data;
                }
            },
            DELETE: async (url, data, contentType = 'application/json', responseType = 'json') => {
                try {
                    let response = await axios.delete(`${BASE_URL}${url}`, {
                        headers: {
                            Authorization: `Bearer ${state.userToken}`,
                            'Content-Type': contentType,
                        },
                        data,
                        responseType,
                    });

                    return response;
                } catch (e) {
                    if (e?.response?.status === 401) {
                        handlers.logOut();
                    }
                    return e?.response?.data;
                }
            },
        }),
        [state]
    );
    return { authFunc: handlers, authState: state, authDispatch: dispatch };
};
