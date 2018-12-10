/***********************************************************************************
* This file is part of Visual Define-XML Editor. A program which allows to review  *
* and edit XML files created using CDISC Define-XML standard.                      *
* Copyright (C) 2018 Dmitry Kolosov                                                *
*                                                                                  *
* Visual Define-XML Editor is free software: you can redistribute it and/or modify *
* it under the terms of version 3 of the GNU Affero General Public License         *
*                                                                                  *
* Visual Define-XML Editor is distributed in the hope that it will be useful,      *
* but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY   *
* or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License   *
* version 3 (http://www.gnu.org/licenses/agpl-3.0.txt) for more details.           *
***********************************************************************************/

import {
    UPD_GLOBALVARSSTOID
} from "constants/action-types";

const initialState = {
    studyName        : '',
    protocolName     : '',
    studyDescription : '',
};

const updateGlobalVariables = (state, action) => {
    let newGlobalVariables;
    if (action.updateObj.hasOwnProperty('studyOid')) {
        newGlobalVariables = action.updateObj;
        delete newGlobalVariables.studyOid;
    } else {
        newGlobalVariables = action.updateObj;
    }
    return { ...state, ...newGlobalVariables };
};

const globalVariables = (state = initialState, action) => {
    switch (action.type) {
        case UPD_GLOBALVARSSTOID:
            return updateGlobalVariables(state, action);
        default:
            return state;
    }
};

export default globalVariables;
