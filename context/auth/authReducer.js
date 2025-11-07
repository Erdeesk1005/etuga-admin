const reducer = (state, action) => {
    switch (action.type) {
        case 'SIGN_IN':
            return {
                ...state,
                userToken: action.payload,
                isLoggedIn: true,
            };
        case 'SET_USER':
            return {
                ...state,
                data: action.payload,
                isLoggedIn: true,
            };

        case 'SIGN_OUT':
            return {
                ...state,
                userToken: null,
                isLoggedIn: false,
            };
        case 'DYNAMIC_UPDATE':
            return {
                ...state,
                [action.payload.type]: action.payload.value,
            };

        default:
            return state;
    }
};

export default reducer;
