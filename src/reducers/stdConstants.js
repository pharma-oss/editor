import {
    ADD_STDCONST
} from "../constants/action-types";

const dataTypes = [
    'text',
    'integer',
    'float',
    'date',
    'datetime',
    'time',
    'partialDate',
    'partialTime',
    'partialDatetime',
    'incompleteDatetime',
    'durationDatetime',
];

const codeListTypes =  [
    {'enumerated': 'Enumeration'},
    {'decoded': 'Decoded'},
    {'external': 'External Codelist'},
];

const standardNames = {
    '2.0.0': [
        'SDTM-IG',
        'SDTM-IG-MD',
        'SDTM-IG-AP',
        'SDTM-IG-PGx',
        'SEND-IG',
        'SEND-IG-DART',
        'ADaM-IG',
    ],
    '2.1.0': [
        'SDTMIG',
        'SDTMIG-MD',
        'SDTMIG-AP',
        'SDTMIG-PGx',
        'SENDIG',
        'SENDIG-DART',
        'ADaMIG',
    ],
};

const initialState = {
    dataTypes,
    codeListTypes,
    standardNames,
};

const stdConstants = (state = initialState, action) => {
    switch (action.type) {
        case ADD_STDCONST:
            return initialState;
        default:
            return state;
    }
};

export default stdConstants;
