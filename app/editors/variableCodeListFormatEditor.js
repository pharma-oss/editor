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

import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import SaveCancel from 'editors/saveCancel.js';
import TextField from '@material-ui/core/TextField';
import getSelectionList from 'utils/getSelectionList.js';
import sortCodeLists from 'utils/sortCodeLists.js';
import checkForSpecialChars from 'utils/checkForSpecialChars.js';

const styles = theme => ({
    textField: {
        minWidth: '100px',
    },
    value: {
        whiteSpace   : 'normal',
        overflowWrap : 'break-word',
    },
    root: {
        outline: 'none',
    },
    helperText: {
        whiteSpace : 'pre-wrap',
    },
});

class VariableCodeListFormatEditor extends React.Component {
    constructor (props) {
        super(props);
        this.state = { ...this.props.defaultValue };
    }

    handleChange = name => event => {
        // For items with the text datatype always prefix the value with $ or is blank
        if (this.props.row.dataType === 'text' && name === 'displayFormat' && event.target.value.match(/^\$|^$/) === null) {
            this.setState({ [name]: '$' + event.target.value });
        } else if (name === 'codeListOid') {
            if (event.target.value !== '') {
                this.setState({ codeListOid: event.target.value });
            } else {
                this.setState({ codeListOid: undefined });
            }
        } else {
            this.setState({ [name]: event.target.value });
        }
    }

    save = () => {
        this.props.onUpdate(this.state);
    }

    cancel = () => {
        this.props.onUpdate(this.props.defaultValue);
    }

    onKeyDown = (event)  => {
        if (event.key === 'Escape' || event.keyCode === 27) {
            this.cancel();
        } else if (event.ctrlKey && (event.keyCode === 83)) {
            this.save();
        }
    }

    render() {
        const {classes} = this.props;
        const displayFormat = this.state.displayFormat || '';
        const codeListOid = this.state.codeListOid || '';
        // Get list of codeLists
        let sortedCodeListIds = sortCodeLists(this.props.codeLists);
        let codeLists = sortedCodeListIds.map( codeListOid => {
            let result = {};
            if (this.props.defaultValue.dataType === undefined || this.props.defaultValue.dataType === this.props.codeLists[codeListOid].dataType) {
                result[codeListOid] = this.props.codeLists[codeListOid].name;
            }
            return result;
        });
        // Remove blank codelists
        codeLists = codeLists.filter( codeList => {
            return Object.keys(codeList).length !== 0;
        });

        let issue = false;
        let helperText = '';
        if (displayFormat !== undefined) {
            let issues = checkForSpecialChars(displayFormat, new RegExp(/[^$a-zA-Z_0-9]/,'g'), 'Invalid character' );
            // Check label length is withing 40 chars
            if (displayFormat.length > 32) {
                let issueText = `Value length is ${displayFormat.length}, which exceeds 32 characters.`;
                issues.push(issueText);
            }
            if (issues.length > 0) {
                issue = true;
                helperText = issues.join('\n');
            }
        }

        return (
            <div
                onKeyDown={this.onKeyDown}
                tabIndex='0'
                className={classes.root}
            >
                <Grid container spacing={0}>
                    <Grid item xs={12}>
                        <TextField
                            label='CodeList'
                            autoFocus
                            fullWidth
                            select
                            multiline
                            value={codeListOid}
                            onChange={this.handleChange('codeListOid')}
                            className={classes.textField}
                            InputProps={{classes: {input: classes.value}}}
                        >
                            {getSelectionList(codeLists,true)}
                        </TextField>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label='Display Format'
                            fullWidth
                            error={issue}
                            helperText={issue && helperText}
                            FormHelperTextProps={{className: classes.helperText}}
                            value={displayFormat}
                            onChange={this.handleChange('displayFormat')}
                            className={classes.textField}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <SaveCancel mini icon save={this.save} cancel={this.cancel}/>
                    </Grid>
                </Grid>
            </div>
        );
    }
}

VariableCodeListFormatEditor.propTypes = {
    classes      : PropTypes.object.isRequired,
    defaultValue : PropTypes.object.isRequired,
    codeLists    : PropTypes.object.isRequired,
    onUpdate     : PropTypes.func.isRequired,
};

export default withStyles(styles)(VariableCodeListFormatEditor);

