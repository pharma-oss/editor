/***********************************************************************************
* This file is part of Visual Define-XML Editor. A program which allows to review  *
* and edit XML files created using the CDISC Define-XML standard.                  *
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

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import ReactSelectEditor from 'editors/reactSelectEditor.js';

// Redux functions
const mapStateToProps = state => {
    return {
        codeLists: state.present.odm.study.metaDataVersion.codeLists,
    };
};

class ConnectedLinkedCodeListEditor extends React.Component {
    getLinkableCodelists = (type) => {
        let linkedCodeListType;
        if (type === 'decoded') {
            linkedCodeListType = 'enumerated';
        } else if (type === 'enumerated') {
            linkedCodeListType = 'decoded';
        }
        // Get list of codelists with decodes for enumeration codelist and vice versa for linked codelist selection;
        return Object.keys(this.props.codeLists).filter(codeListOid => {
            return this.props.codeLists[codeListOid].codeListType === linkedCodeListType;
        }).map(codeListOid => {
            if (this.props.codeLists[codeListOid].linkedCodeListOid !== undefined && this.props.row.oid !== this.props.codeLists[this.props.codeLists[codeListOid].linkedCodeListOid].oid) {
                return {
                    value: this.props.codeLists[codeListOid].oid,
                    label: this.props.codeLists[codeListOid].name + ' (Linked to ' + this.props.codeLists[this.props.codeLists[codeListOid].linkedCodeListOid].name + ')'
                };
            } else {
                return { value: this.props.codeLists[codeListOid].oid, label: this.props.codeLists[codeListOid].name };
            }
        });
    }

    handleChange = (updateObj) => {
        if (updateObj === '') {
            this.props.onUpdate(undefined);
        } else {
            this.props.onUpdate(updateObj);
        }
    }

    render () {
        // If it is not a enumeration or decoded codelist, just exit editing.
        if (this.props.row.codeListType !== 'decoded' && this.props.row.codeListType !== 'enumerated') {
            this.props.onUpdate(this.props.defaultValue);
        }
        return (
            <ReactSelectEditor
                handleChange={this.handleChange}
                options={this.getLinkableCodelists(this.props.row.codeListType)}
                extensible={false}
                value={this.props.codeLists[this.props.row.oid].linkedCodeListOid || ''}
            />
        );
    }
}

ConnectedLinkedCodeListEditor.propTypes = {
    codeLists: PropTypes.object.isRequired,
    defaultValue: PropTypes.string.isRequired,
    row: PropTypes.object.isRequired,
    onUpdate: PropTypes.func
};

const LinkedCodeListEditor = connect(mapStateToProps)(ConnectedLinkedCodeListEditor);
export default LinkedCodeListEditor;
