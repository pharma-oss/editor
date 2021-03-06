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
import clone from 'clone';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import DocumentEditor from 'editors/documentEditor.js';
import FormalExpressionEditor from 'editors/formalExpressionEditor.js';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import RemoveIcon from '@material-ui/icons/RemoveCircleOutline';
import ClearIcon from '@material-ui/icons/Clear';
import CodeIcon from '@material-ui/icons/Code';
import DetachMethodIcon from '@material-ui/icons/CallSplit';
import InsertLink from '@material-ui/icons/InsertLink';
import AddIcon from '@material-ui/icons/AddCircle';
import Tooltip from '@material-ui/core/Tooltip';
import Switch from '@material-ui/core/Switch';
import MenuItem from '@material-ui/core/MenuItem';
import getOid from 'utils/getOid.js';
import checkForSpecialChars from 'utils/checkForSpecialChars.js';
import CommentMethodTable from 'components/utils/commentMethodTable.js';
import getMethodSourceLabels from 'utils/getMethodSourceLabels.js';
import SelectMethodIcon from '@material-ui/icons/OpenInNew';
import { Method, TranslatedText, FormalExpression, Document } from 'core/defineStructure.js';
import { addDocument, getDescription, setDescription } from 'utils/defineStructureUtils.js';

const styles = theme => ({
    button: {
        margin: theme.spacing(1),
    },
    iconButton: {
        marginLeft: '0px',
        marginRight: '0px',
        marginBottom: '8px',
    },
    editorHeading: {
        minWidth: '70px',
    },
    methodType: {
        minWidth: '110px',
    },
    methodName: {
        marginLeft: '8px',
    },
    multipleSourcesLine: {
        whiteSpace: 'pre-wrap',
        color: 'grey',
    },
    titleLine: {
        height: '40px',
    },
    helperText: {
        whiteSpace: 'pre-wrap',
        color: theme.palette.primary.main,
    },
});

const mapStateToProps = state => {
    return {
        leafs: state.present.odm.study.metaDataVersion.leafs,
        mdv: state.present.odm.study.metaDataVersion,
        methods: state.present.odm.study.metaDataVersion.methods,
        lang: state.present.odm.study.metaDataVersion.lang,
        textInstantProcessing: state.present.settings.editor.textInstantProcessing,
    };
};

class ConnectedMethodEditor extends React.Component {
    constructor (props) {
        super(props);
        // Bootstrap table changed undefined to '' when saving the value.
        // Catching this and resetting to undefined in case it is an empty string
        let defaultValue;
        if (this.props.stateless !== true) {
            if (this.props.method === '') {
                defaultValue = undefined;
            } else {
                defaultValue = this.props.method;
            }
            this.state = {
                method: defaultValue,
                selectMethodOpened: false,
            };
        } else {
            this.state = {
                selectMethodOpened: false,
            };
        }
    }

    handleChange = (name, methodName) => (updateObj, checked) => {
        let newMethod;
        let method = this.props.stateless === true ? this.props.method : this.state.method;
        if (name === 'addMethod') {
            let methodOid = getOid('Method', Object.keys(this.props.methods));
            let name;
            let autoMethodName;
            if (this.props.fullName !== undefined) {
                autoMethodName = true;
                name = 'Algorithm for ' + this.props.fullName;
            } else {
                autoMethodName = false;
                name = '';
            }
            newMethod = { ...new Method({
                oid: methodOid,
                name,
                autoMethodName,
                descriptions: [ { ...new TranslatedText({ lang: this.props.lang, value: '' }) } ]
            }) };
        } else if (name === 'deleteMethod') {
            newMethod = undefined;
        } else if (name === 'textUpdate') {
            newMethod = clone(method);
            setDescription(newMethod, updateObj.target.value);
        } else if (name === 'typeUpdate') {
            newMethod = clone(method);
            newMethod.type = updateObj.target.value;
        } else if (name === 'nameUpdate') {
            newMethod = clone(method);
            newMethod.name = updateObj.target.value;
        } else if (name === 'autoMethodNameUpdate') {
            newMethod = clone(method);
            newMethod.autoMethodName = checked;
            if (checked) {
                newMethod.name = 'Algorithm for ' + this.props.fullName;
            }
        } else if (name === 'addDocument') {
            newMethod = clone(method);
            let leafs = this.props.leafs;
            if (leafs && Object.keys(leafs).length > 0) {
                let document = new Document({ leafId: Object.keys(leafs)[0] });
                addDocument(newMethod, document);
            } else {
                addDocument(newMethod);
            }
        } else if (name === 'updateDocument') {
            newMethod = updateObj;
        } else if (name === 'addFormalExpression') {
            newMethod = clone(method);
            newMethod.formalExpressions.push({ ...new FormalExpression() });
        } else if (name === 'deleteFormalExpression') {
            newMethod = clone(method);
            newMethod.formalExpressions = [];
        } else if (name === 'updateFormalExpression') {
            newMethod = clone(method);
            newMethod.formalExpressions[0] = updateObj;
        } else if (name === 'selectMethod') {
            newMethod = updateObj;
            this.setState({ selectMethodOpened: false });
        } else if (name === 'copyMethod') {
            let methodOid = getOid('Method', Object.keys(this.props.methods));
            newMethod = { ...new Method({ ...clone(updateObj), oid: methodOid, sources: undefined }) };
            this.setState({ selectMethodOpened: false });
        } else if (name === 'detachMethod') {
            let methodOid = getOid('Method', Object.keys(this.props.methods));
            newMethod = { ...new Method({ ...clone(this.props.stateless ? this.props.method : this.state.method), oid: methodOid, sources: undefined }) };
        }

        if (this.props.stateless === true) {
            // If state should be uplifted - use the callback
            this.props.onUpdate(newMethod);
        } else {
            // Otherwise update state locally
            this.setState({ method: newMethod });
        }
    }

    handleSelectDialog = (name) => (updateObj) => {
        if (name === 'openSelectMethod') {
            this.setState({ selectMethodOpened: true });
        } else if (name === 'closeSelectMethod') {
            this.setState({ selectMethodOpened: false });
        }
    }

    getSelectionList = (list, optional) => {
        let selectionList = [];
        if (list.length < 1) {
            throw Error('Blank value list provided for the ItemSelect element');
        } else {
            if (optional === true) {
                selectionList.push(<MenuItem key='0' value=''><em>None</em></MenuItem>);
            }
            list.forEach((value, index) => {
                if (typeof value === 'object') {
                    selectionList.push(<MenuItem key={index + 1} value={Object.keys(value)[0]}>{value[Object.keys(value)[0]]}</MenuItem>);
                } else {
                    selectionList.push(<MenuItem key={index + 1} value={value}>{value}</MenuItem>);
                }
            });
        }
        return selectionList;
    }

    save = () => {
        this.props.onUpdate(this.state.method);
    }

    cancel = () => {
        this.props.onUpdate(this.props.method);
    }

    render () {
        const { classes } = this.props;
        let method = this.props.stateless === true ? this.props.method : this.state.method;
        const methodTypeList = ['Imputation', 'Computation'];
        let methodName, autoMethodName, methodType, formalExpressionExists;
        let issue = false;
        let helperText;
        let methodText;
        if (method !== undefined) {
            methodText = getDescription(method);
            methodName = method.name || '';
            autoMethodName = method.autoMethodName;
            // If method type is not set, default it to Computation when it is one of the options
            methodType = method.type || (methodTypeList.indexOf('Computation') >= 0 ? 'Computation' : '');
            formalExpressionExists = (method.formalExpressions[0] !== undefined);
            // Check for special characters
            // eslint-disable-next-line no-control-regex
            let issues = checkForSpecialChars(methodText, new RegExp(/[^\u000A\u000D\u0020-\u007f]/, 'g'));
            if (issues.length > 0) {
                issue = true;
                helperText = issues.join('\n');
            }
        } else {
            methodName = '';
            autoMethodName = false;
            methodText = '';
            methodType = methodTypeList.indexOf('Computation') >= 0 ? 'Computation' : '';
            formalExpressionExists = false;
        }

        if (autoMethodName) {
            methodName = 'Algorithm for ' + this.props.fullName;
        }

        let usedBy;
        let sourceLabels = { count: 0 };
        if (method !== undefined) {
            sourceLabels = getMethodSourceLabels(method.sources, this.props.mdv);
            if (sourceLabels.count > 1) {
                usedBy = sourceLabels.labelParts.join('. ');
            }
        }

        return (
            <Grid container spacing={1}>
                <Grid item xs={12}>
                    <Grid container spacing={0} justify='flex-start' alignItems='center' className={classes.titleLine}>
                        <Grid item className={classes.editorHeading}>
                            <Typography variant="subtitle1" >
                                Method
                            </Typography>
                        </Grid>
                        <Grid item>
                            <Tooltip title={method === undefined ? 'Add Method' : 'Remove Method'} placement='bottom' enterDelay={1000}>
                                <span>
                                    <IconButton
                                        onClick={method === undefined ? this.handleChange('addMethod') : this.handleChange('deleteMethod')}
                                        className={classes.iconButton}
                                        color={method === undefined ? 'primary' : 'secondary'}
                                    >
                                        {method === undefined ? <AddIcon/> : <RemoveIcon/>}
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Grid>
                        <Grid item>
                            <Tooltip title='Add Link to Document' placement='bottom' enterDelay={1000}>
                                <span>
                                    <IconButton
                                        onClick={this.handleChange('addDocument')}
                                        disabled={method === undefined || Object.keys(this.props.leafs).length < 1}
                                        className={classes.iconButton}
                                        color={method !== undefined ? 'primary' : 'default'}
                                    >
                                        <InsertLink/>
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Grid>
                        <Grid item>
                            <Tooltip title={formalExpressionExists === false ? 'Add Formal Expression' : 'Remove Formal Expression'} placement='bottom' enterDelay={1000}>
                                <span>
                                    <IconButton
                                        onClick={formalExpressionExists === false ? this.handleChange('addFormalExpression', 0) : this.handleChange('deleteFormalExpression', 0)}
                                        className={classes.iconButton}
                                        disabled={method === undefined}
                                        color={formalExpressionExists === false ? 'primary' : 'secondary'}
                                    >
                                        {formalExpressionExists === false ? <CodeIcon/> : <ClearIcon/>}
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Grid>
                        <Grid item>
                            <Tooltip title='Select Method' placement='bottom' enterDelay={1000}>
                                <span>
                                    <IconButton
                                        onClick={this.handleSelectDialog('openSelectMethod')}
                                        disabled={method === undefined}
                                        className={classes.iconButton}
                                        color={method !== undefined ? 'primary' : 'default'}
                                    >
                                        <SelectMethodIcon/>
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Grid>
                        {(sourceLabels.count > 1) &&
                                <Grid item>
                                    <Tooltip title='Detach Method' placement='bottom' enterDelay={1000}>
                                        <IconButton
                                            onClick={this.handleChange('detachMethod')}
                                            className={classes.iconButton}
                                            color='primary'
                                        >
                                            <DetachMethodIcon/>
                                        </IconButton>
                                    </Tooltip>
                                </Grid>
                        }
                    </Grid>
                </Grid>
                {(sourceLabels.count > 1) &&
                        <Grid item xs={12}>
                            <div className={classes.multipleSourcesLine}>
                                This method is used by multiple sources. {usedBy}
                            </div>
                        </Grid>
                }
                <Grid item xs={12}>
                    { this.state.selectMethodOpened &&
                            <CommentMethodTable
                                type='Method'
                                onSelect={this.handleChange('selectMethod')}
                                onCopy={this.handleChange('copyMethod')}
                                onClose={this.handleSelectDialog('closeSelectMethod')}
                            />
                    }
                    {method !== undefined &&
                            <Grid container spacing={1}>
                                <Grid item xs={12}>
                                    <Grid container spacing={2} justify='flex-start'>
                                        <Grid item>
                                            <TextField
                                                label='Method Type'
                                                select
                                                value={methodType}
                                                onChange={this.handleChange('typeUpdate')}
                                                className={classes.methodType}
                                            >
                                                {this.getSelectionList(methodTypeList)}
                                            </TextField>
                                        </Grid>
                                        <Grid item>
                                            <Tooltip
                                                title={autoMethodName ? 'Set Method Name Automatically' : 'Set Method Name Manually'}
                                                placement='bottom'
                                                enterDelay={1000}
                                            >
                                                <Switch
                                                    checked={autoMethodName}
                                                    onChange={this.handleChange('autoMethodNameUpdate')}
                                                    disabled={this.props.fullName === undefined}
                                                    color='primary'
                                                />
                                            </Tooltip>
                                        </Grid>
                                        <Grid xs={true} item>
                                            <TextField
                                                label="Method Name"
                                                fullWidth
                                                multiline
                                                disabled={autoMethodName}
                                                value={methodName}
                                                onChange={this.handleChange('nameUpdate')}
                                                className={classes.methodName}
                                            />
                                        </Grid>
                                    </Grid>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Method Text"
                                        multiline
                                        fullWidth
                                        autoFocus
                                        key={method.oid}
                                        defaultValue={methodText}
                                        helperText={issue && helperText}
                                        FormHelperTextProps={{ className: classes.helperText }}
                                        onBlur={!this.props.textInstantProcessing ? this.handleChange('textUpdate') : undefined}
                                        onChange={this.props.textInstantProcessing ? this.handleChange('textUpdate') : undefined}
                                        margin="normal"
                                    />
                                    <DocumentEditor
                                        parentObj={method}
                                        handleChange={this.handleChange('updateDocument')}
                                        leafs={this.props.leafs}
                                    />
                                </Grid>
                                {formalExpressionExists === true &&
                                        <Grid item xs={12}>
                                            <FormalExpressionEditor
                                                value={method.formalExpressions[0]}
                                                handleChange={this.handleChange('updateFormalExpression')}
                                            />
                                        </Grid>
                                }
                            </Grid>
                    }
                </Grid>
                {this.props.stateless !== true &&
                    <Grid item xs={12} >
                        <br/>
                        <Button color='primary' onClick={this.save} variant='contained' className={classes.button}>Save</Button>
                        <Button color='secondary' onClick={this.cancel} variant='contained' className={classes.button}>Cancel</Button>
                    </Grid>
                }
            </Grid>
        );
    }
}

ConnectedMethodEditor.propTypes = {
    method: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.oneOf(['']),
    ]),
    mdv: PropTypes.object.isRequired,
    leafs: PropTypes.object.isRequired,
    lang: PropTypes.string.isRequired,
    methods: PropTypes.object.isRequired,
    fullName: PropTypes.string,
    onUpdate: PropTypes.func,
    stateless: PropTypes.bool,
    textInstantProcessing: PropTypes.bool,
};

const MethodEditor = connect(mapStateToProps)(ConnectedMethodEditor);
export default withStyles(styles)(MethodEditor);
