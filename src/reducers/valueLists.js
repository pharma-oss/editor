import {
    DEL_VARS,
    UPD_NAMELABELWHERECLAUSE,
    UPD_ITEMREF,
    ADD_VALUELIST,
    INSERT_VALLVL,
    UPD_ITEMDESCRIPTION,
    UPD_VLMITEMREFORDER,
} from "constants/action-types";
import { ValueList, ItemRef } from 'elements.js';
import getOid from 'utils/getOid.js';

const addValueList = (state, action) => {
    // Create a new ItemRef (valueList will contain 1 variable)
    let itemRef = new ItemRef({ itemOid: action.itemDefOid, whereClauseOid: action.whereClauseOid });
    let itemRefs = { [itemRef.oid]: itemRef };
    let itemRefOrder = [itemRef.oid];
    let valueList = new ValueList(
        {
            oid     : action.valueListOid,
            sources : {itemDefs: [action.source.oid]},
            itemRefs,
            itemRefOrder,
        });
    return { ...state, [action.valueListOid]: valueList };
};

const updateItemRefOrder = (state, action) => {
    // Check if order changed;
    let newValueList =  new ValueList({ ...state[action.valueListOid], itemRefOrder: action.itemRefOrder });
    return { ...state, [action.valueListOid]: newValueList };
};

/*
const deleteValueLists = (state, action) => {
    // action.deleteObj.valueListOids - oids to remove;
    let newState = { ...state };
    action.deleteObj.valueListOids.forEach( valueListOid => {
        delete newState[valueListOid];
    });

    return newState;
};

const updateItemRefKeyOrder = (state, action) => {
    // Check if order changed;
    let ds = state[action.source.valueListOid];
    let newItemRefOrder;
    let newKeyOrder;
    if (action.updateObj.orderNumber !== action.prevObj.orderNumber) {
        newItemRefOrder = ds.itemRefOrder.slice();
        // Delete element from the ordered array
        newItemRefOrder.splice(newItemRefOrder.indexOf(action.source.itemRefOid),1);
        // Insert it in the new place
        if (action.updateObj.orderNumber !== ds.itemRefOrder.length) {
            newItemRefOrder.splice(action.updateObj.orderNumber - 1, 0, action.source.itemRefOid);
        } else {
            newItemRefOrder.push(action.source.itemRefOid);
        }
    } else {
        newItemRefOrder = ds.itemRefOrder;
    }
    if (action.updateObj.keySequence !== action.prevObj.keySequence) {
        newKeyOrder = ds.keyOrder.slice();
        // Delete element from the keys array if it was a key
        if (ds.keyOrder.includes(action.source.itemRefOid)) {
            newKeyOrder.splice(newKeyOrder.indexOf(action.source.itemRefOid),1);
        }
        // Insert it in the new place
        if (action.updateObj.keySequence !== ds.keyOrder.length) {
            newKeyOrder.splice(action.updateObj.keySequence - 1, 0, action.source.itemRefOid);
        } else {
            newKeyOrder.push(action.source.itemRefOid);
        }

    } else {
        newKeyOrder = ds.keyOrder;
    }
    let newValueList =  new ValueList({ ...state[action.source.valueListOid],
        itemRefOrder : newItemRefOrder,
        keyOrder     : newKeyOrder,
    });
    return { ...state, [action.source.valueListOid]: newValueList };
};

const addVariable = (state, action) => {
    // Check if order changed;
    let ds = state[action.source.valueListOid];
    let newItemRefOrder;
    if (action.orderNumber - 1 <= ds.itemRefOrder.length) {
        newItemRefOrder = ds.itemRefOrder.slice(0,action.orderNumber - 1).concat([action.itemRef.oid].concat(ds.itemRefOrder.slice(action.orderNumber - 1))) ;
    } else {
        newItemRefOrder = ds.itemRefOrder.slice().concat([action.itemRef.oid]);
    }
    let newValueList =  new ValueList({ ...state[action.source.valueListOid],
        itemRefOrder : newItemRefOrder,
        itemRefs     : { ...state[action.source.valueListOid].itemRefs, [action.itemRef.oid]: action.itemRef },
    });
    return { ...state, [action.source.valueListOid]: newValueList };
};
*/
const updateItemRef = (state, action) => {
    if (!action.source.vlm) {
        return state;
    } else {
        let newItemRef = new ItemRef({ ...state[action.source.itemGroupOid].itemRefs[action.source.itemRefOid], ...action.updateObj });
        let newValueList =  new ValueList({ ...state[action.source.itemGroupOid],
            itemRefs: { ...state[action.source.itemGroupOid].itemRefs, [action.source.itemRefOid]: newItemRef }
        });
        return { ...state, [action.source.itemGroupOid]: newValueList };
    }
};

const updateItemDescription = (state, action) => {
    // Skip update if this is not a VLM itemRef
    if (!action.source.vlm) {
        return state;
    } else {
        // Method
        let previousMethodOid;
        if (action.prevObj.method !== undefined) {
            previousMethodOid = action.prevObj.method.oid;
        }
        let newMethodOid;
        if (action.updateObj.method !== undefined) {
            newMethodOid = action.updateObj.method.oid;
        }
        if (previousMethodOid !== newMethodOid) {
            let newAction = {};
            newAction.source = action.source;
            newAction.updateObj = { methodOid: newMethodOid };
            return updateItemRef(state, newAction);
        } else {
            return state;
        }
    }
};

const deleteValueList = (state, action) => {
    let valueListOid = action.valueListOid;
    let itemDefOid = action.source.oid;
    if (state.hasOwnProperty(valueListOid)) {
        let newState = { ...state };
        let sourceItemDefs = newState[valueListOid].sources.itemDefs;
        if (sourceItemDefs.length === 1 && sourceItemDefs[0] === itemDefOid) {
            // Fully remove valueList
            delete newState[valueListOid];
        } else if (sourceItemDefs.includes(itemDefOid)) {
            // Remove referece to the source OID from the list of valueList sources
            let newSources = sourceItemDefs.slice();
            newSources.splice(newSources.indexOf(itemDefOid),1);
            let newValueList = new ValueList({ ...newState[valueListOid], sources: { itemDefs: newSources } });
            newState = { ...newState, [newValueList.oid]: newValueList };
        }
        return newState;
    } else {
        return state;
    }
};

const deleteVariables = (state, action) => {
    let newState = { ...state };
    // Delete valueLists which were completely removed
    // Theoretically 2 ItemDefs can reference the same valueList
    Object.keys(action.deleteObj.valueListOids).forEach( itemDefOid => {
        action.deleteObj.valueListOids[itemDefOid].forEach( valueListOid => {
            let subAction = { source: {} };
            subAction.source.oid = itemDefOid;
            subAction.valueListOid = valueListOid;
            newState = deleteValueList(newState, subAction);
        });
    });
    // Delete individual itemRefs
    Object.keys(action.deleteObj.vlmItemRefOids).forEach( valueListOid => {
        if (newState.hasOwnProperty(valueListOid)) {
            let valueList = state[valueListOid];
            let newItemRefs = Object.assign({}, valueList.itemRefs);
            action.deleteObj.vlmItemRefOids[valueListOid].forEach( itemRefOid => {
                if (newItemRefs.hasOwnProperty(itemRefOid)) {
                    delete newItemRefs[itemRefOid];
                }
            });
            // Update itemRef order array
            let newItemRefOrder = valueList.itemRefOrder.slice();
            action.deleteObj.vlmItemRefOids[valueListOid].forEach( itemRefOid => {
                if (newItemRefOrder.includes(itemRefOid)) {
                    newItemRefOrder.splice(newItemRefOrder.indexOf(itemRefOid),1);
                }
            });
            // Check if there are any key variables removed;
            let newKeyOrder;
            let keysAreRemoved = action.deleteObj.vlmItemRefOids[valueListOid].reduce( (includesKey, itemRefOid) => {
                return includesKey || valueList.keyOrder.includes(itemRefOid);
            }, false);
            if (keysAreRemoved) {
                newKeyOrder = valueList.keyOrder.slice();
                action.deleteObj.vlmItemRefOids[valueListOid].forEach( itemRefOid => {
                    if (newKeyOrder.includes(itemRefOid)) {
                        newKeyOrder.splice(newKeyOrder.indexOf(itemRefOid),1);
                    }
                });
            } else {
                newKeyOrder = valueList.keyOrder;
            }
            let newValueList =  new ValueList({ ...newState[valueListOid],
                itemRefs     : newItemRefs,
                itemRefOrder : newItemRefOrder,
                keyOrder     : newKeyOrder,
            });

            newState = { ...newState, [valueListOid]: newValueList };
        }
    });
    return newState;
};

const updateItemRefWhereClause = (state, action) => {
    // action.source = {oid, itemRefOid, valueListOid}
    // action.updateObj = {name, description, whereClause, wcComment, oldWcCommentOid, oldWcOid}
    // Check if the whereClauseOid changed;
    let valueList = state[action.source.valueListOid];
    let itemRef = valueList.itemRefs[action.source.itemRefOid];
    if (action.updateObj.whereClause.oid !== itemRef.whereClauseOid) {
        let newItemRef =  new ItemRef({ ...itemRef, whereClauseOid: action.updateObj.whereClause.oid });
        let newValueList =  new ValueList({ ...valueList, itemRefs: { ...valueList.itemRefs, [action.source.itemRefOid]: newItemRef } });
        return { ...state, [action.source.valueListOid]: newValueList };
    }
    else {
        return state;
    }
};

const insertValueLevel = (state, action) => {
    let itemRefOid = getOid('ItemRef', undefined, state[action.valueListOid].itemRefOrder);
    let itemRef = new ItemRef({ oid: itemRefOid, itemOid: action.itemDefOid, whereClauseOid: action.whereClauseOid });
    let itemRefs = { ...state[action.valueListOid].itemRefs, [itemRefOid]: itemRef };
    let itemRefOrder = state[action.valueListOid].itemRefOrder.slice();
    if (action.orderNumber === 0) {
        itemRefOrder.unshift(itemRefOid);
    } else {
        itemRefOrder.splice(action.orderNumber, 0, itemRefOid);
    }
    let valueList = new ValueList(
        {
            ...state[action.valueListOid],
            itemRefs,
            itemRefOrder,
        });
    return { ...state, [action.valueListOid]: valueList };
};

const valueLists = (state = {}, action) => {
    switch (action.type) {
        /*
        case DEL_ITEMGROUPS:
            return deleteValueLists(state, action);
            */
        case ADD_VALUELIST:
            return addValueList(state, action);
        case UPD_ITEMDESCRIPTION:
            return updateItemDescription(state, action);
        case UPD_NAMELABELWHERECLAUSE:
            return updateItemRefWhereClause(state, action);
        case DEL_VARS:
            return deleteVariables(state, action);
        case UPD_ITEMREF:
            return updateItemRef(state, action);
        case UPD_VLMITEMREFORDER:
            return updateItemRefOrder(state, action);
        case INSERT_VALLVL:
            return insertValueLevel(state, action);
        default:
            return state;
    }
};

export default valueLists;
