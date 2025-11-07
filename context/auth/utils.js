import Cookies from 'js-cookie';

export const setcookie = (value) => {
    Cookies.set('at', value, { expires: 1 });
};

export const getcookie = () => {
    return Cookies.get('at');
};

export const removeCookie = () => {
    Cookies.remove('user');
    Cookies.remove('csrftoken');
    Cookies.remove('JSESSIONID');
    Cookies.remove('at');
};
