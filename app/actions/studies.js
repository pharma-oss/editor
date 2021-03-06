/***********************************************************************************
* This file is part of Visual Define-XML Editor. A program which allows to review  *
* and edit XML files created using the CDISC Define-XML standard.                  *
* Copyright (C) 2018, 2019 Dmitry Kolosov                                          *
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
    STUDY_ADD,
    STUDY_DEL,
    STUDY_UPD,
    STUDY_UPDORDER,
    STUDY_UPDDEFINEORDER,
    STUDY_IMPORT,
} from 'constants/action-types';
import changeAppTitle from 'utils/changeAppTitle.js';

export const addStudy = (updateObj) => (
    {
        type: STUDY_ADD,
        updateObj,
    }
);

export const deleteStudy = (deleteObj) => {
    // Reset title of the application
    changeAppTitle();

    return {
        type: STUDY_DEL,
        deleteObj,
    };
};

export const updateStudy = (updateObj) => (
    {
        type: STUDY_UPD,
        updateObj,
    }
);

export const updateStudyOrder = (updateObj) => (
    {
        type: STUDY_UPDORDER,
        updateObj,
    }
);

export const updateDefineOrder = (updateObj) => (
    {
        type: STUDY_UPDDEFINEORDER,
        updateObj,
    }
);

export const studyImport = (updateObj) => (
    {
        type: STUDY_IMPORT,
        updateObj,
    }
);
