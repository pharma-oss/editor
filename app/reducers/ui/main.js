import {
    UI_TOGGLEMAINMENU,
    UI_SETCURRENTPAGE,
} from "constants/action-types";

const generateInitialState = () => {
    return {
        mainMenuOpened : false,
        currentPage    : 'studies',
    };
};

const initialState = generateInitialState();

const toggleMainMenu = (state, action) => {
    return ({
        ...state,
        mainMenuOpened: !state.mainMenuOpened,
    });
};

const setCurrentPage = (state, action) => {
    // After the page is selected, close main menu
    return ({
        ...state,
        mainMenuOpened : false,
        currentPage    : action.updateObj,
    });
};

const main = (state = initialState, action) => {
    switch (action.type) {
        case UI_TOGGLEMAINMENU:
            return toggleMainMenu(state, action);
        case UI_SETCURRENTPAGE:
            return setCurrentPage(state, action);
        default:
            return state;
    }
};

export default main;