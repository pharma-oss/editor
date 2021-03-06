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

import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import Grid from '@material-ui/core/Grid';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import DoneAll from '@material-ui/icons/DoneAll';
import RemoveIcon from '@material-ui/icons/RemoveCircleOutline';
import InputAdornment from '@material-ui/core/InputAdornment';
import getSelectionList from 'utils/getSelectionList.js';
import getTableDataAsText from 'utils/getTableDataAsText.js';
import clone from 'clone';
import InternalHelp from 'components/utils/internalHelp.js';
import { VARIABLE_FILTER } from 'constants/help.js';
import {
    updateFilter
} from 'actions/index.js';

const styles = theme => ({
    dialog: {
        position: 'absolute',
        top: '10%',
        maxHeight: '80%',
        width: '60%',
        overflowX: 'auto',
        overflowY: 'auto',
        paddingBottom: theme.spacing(1),
        margin: '0 auto',
        borderRadius: '10px',
        border: '2px solid',
        borderColor: 'primary',
    },
    title: {
        marginBottom: theme.spacing(2),
        backgroundColor: theme.palette.primary.main,
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '1.25rem',
        lineHeight: '1.6',
        letterSpacing: '0.0075em',
    },
    textField: {
        whiteSpace: 'normal',
        minWidth: '120px',
    },
    textFieldComparator: {
        whiteSpace: 'normal',
        minWidth: '50px',
    },
    textFieldValues: {
        whiteSpace: 'normal',
        minWidth: '100px',
        marginLeft: theme.spacing(1),
    },
    valuesGridItem: {
        maxWidth: '60%',
        marginLeft: theme.spacing(1),
    },
    buttonLine: {
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(2),
    },
    connector: {
        marginLeft: theme.spacing(7),
        marginTop: theme.spacing(2),
    },
    firstRangeCheck: {
        marginLeft: theme.spacing(8),
        marginTop: theme.spacing(2),
    },
    button: {
        marginLeft: theme.spacing(1),
    },
    controlButtons: {
        marginTop: theme.spacing(4),
        marginLeft: theme.spacing(1),
    },
});

// Redux functions
const mapDispatchToProps = dispatch => {
    return {
        updateFilter: (oid, updateObj) => dispatch(updateFilter(oid, updateObj)),
    };
};

const mapStateToProps = state => {
    return {
        mdv: state.present.odm.study.metaDataVersion,
        defineVersion: state.present.odm.study.metaDataVersion.defineVersion,
        tabSettings: state.present.ui.tabs.settings[state.present.ui.tabs.currentTab],
    };
};

const comparators = {
    string: ['IN', 'NOTIN', 'EQ', 'NE', 'STARTS', 'ENDS', 'CONTAINS', 'REGEX', 'REGEXI'],
    number: ['<', '<=', '>', '>=', 'IN', 'NOTIN'],
    flag: ['EQ', 'NE', 'IN', 'NOTIN'],
};

const filterFields = {
    'name': { label: 'Name', type: 'string' },
    'label': { label: 'Label', type: 'string' },
    'dataType': { label: 'Data Type', type: 'string' },
    'codeList': { label: 'Codelist', type: 'string' },
    'origin': { label: 'Origin', type: 'string' },
    'length': { label: 'Length', type: 'number' },
    'method': { label: 'Method', type: 'string' },
    'comment': { label: 'Comment', type: 'string' },
    'hasDocument': { label: 'Has Document', type: 'flag' },
    'mandatory': { label: 'Mandatory', type: 'flag' },
    'displayFormat': { label: 'Display Format', type: 'string' },
    'role': { label: 'Role', type: 'flag' },
    'isVlm': { label: 'Is VLM', type: 'flag' },
    'whereClause': { label: 'Where Clause', type: 'string' },
    'parentItemDef': { label: 'Parent Variable', type: 'string' },
    'hasVlm': { label: 'Has VLM', type: 'flag' },
    'dataset': { label: 'Dataset', type: 'flag' },
    'hasReviewComment': { label: 'Has Review Comment', type: 'flag' },
};

class ConnectedVariableTabFilter extends React.Component {
    constructor (props) {
        super(props);
        let conditions;
        let connectors;
        if (this.props.filter.conditions.length !== 0) {
            conditions = clone(this.props.filter.conditions);
            connectors = clone(this.props.filter.connectors);
        } else {
            conditions = [{ field: Object.keys(filterFields)[0], comparator: 'IN', selectedValues: [] }];
            connectors = [];
        }
        // Get the whole table
        // If itemGroupId is provided as a property, use only it
        let values = {};
        if (this.props.itemGroupOid) {
            values = this.getValues(this.props.itemGroupOid);
        } else {
            values = this.getValuesForItemGroups(conditions[0].selectedValues);
            let itemGroups = this.props.mdv.itemGroups;
            // Get the list of all datasets
            values.dataset = Object.keys(itemGroups).map(itemGroupOid => (itemGroups[itemGroupOid].name));
        }
        // As filters are cross-dataset, it is possible that some of the values are not in the new dataset
        // add all values which are already in the IN, NOTIN, EQ, NE filters
        conditions.forEach(condition => {
            if (['IN', 'NOTIN', 'EQ', 'NE'].includes(condition.comparator)) {
                condition.selectedValues.forEach(selectedValue => {
                    if (!values[condition.field].includes(selectedValue)) {
                        values[condition.field].push(selectedValue);
                    }
                });
            }
        });

        this.state = {
            conditions,
            connectors,
            values,
            applyToVlm: this.props.filter.applyToVlm,
        };
    }

    handleChange = (name, index, connector) => (updateObj) => {
        let result = [ ...this.state.conditions ];
        result[index] = { ...this.state.conditions[index] };
        if (name === 'field') {
            // Do nothing if name did not change
            if (result[index].field === updateObj.target.value) {
                return;
            }
            result[index].field = updateObj.target.value;
            if (filterFields[this.state.conditions[index].field].type !== filterFields[result[index].field].type ||
                ['IN', 'NOTIN', 'EQ', 'NE'].includes(result[index].comparator)) {
                // If field type changed or IN/NOTIN/EQ/NE comparators were used, reset all other values
                // For flags use EQ as a default comparator
                if (filterFields[result[index].field].type === 'flag') {
                    result[index].comparator = 'EQ';
                } else {
                    result[index].comparator = 'IN';
                }
                result[index].selectedValues = [];
                result[index].regexIsValid = true;
            }
            this.setState({
                conditions: result,
            });
        } else if (name === 'comparator') {
            let newValues;
            if (result[index].comparator === updateObj.target.value) {
                return;
            }
            result[index].comparator = updateObj.target.value;
            // In case of regular expression, verify it is valid
            result[index].regexIsValid = true;
            if (result[index].comparator.startsWith('REGEX')) {
                try {
                    RegExp(result[index].selectedValues[0]);
                } catch (e) {
                    result[index].regexIsValid = false;
                }
            }
            // Reset check values if there are multiple values selected and changing from IN/NOT to a comparator with a single value
            if (['NOTIN', 'IN'].indexOf(this.state.conditions[index].comparator) >= 0 &&
                ['NOTIN', 'IN'].indexOf(result[index].comparator) < 0 &&
                result[index].selectedValues.length > 1
            ) {
                result[index].selectedValues = [];
            } else if (['NOTIN', 'IN'].indexOf(this.state.conditions[index].comparator) < 0 &&
                ['NOTIN', 'IN'].indexOf(result[index].comparator) >= 0 &&
                result[index].selectedValues.length === 1
            ) {
                // When changed from EQ/NE/REGEX/... to IN/NOTIN
                // It is possible that custom value was used and then user switched to NOTIN/IN selection
                // In this case add custom value to the values, so that they are shown in the drop-down selection
                const values = this.state.values;
                if (values.hasOwnProperty(result[index].field) && !values[result[index].field].includes(result[index].selectedValues[0])) {
                    newValues = { ...values, [result[index].field]: values[result[index].field].concat(result[index].selectedValues) };
                }
            }
            if (newValues === undefined) {
                this.setState({
                    conditions: result,
                });
            } else {
                this.setState({
                    conditions: result,
                    values: newValues,
                });
            }
        } else if (name === 'selectedValues' || name === 'selectAllValues') {
            if (name === 'selectAllValues' && this.state.values.hasOwnProperty(result[index].field)) {
                result[index].selectedValues = this.state.values[result[index].field];
            } else if (name === 'selectAllValues') {
                // Select All does nothing when there is no codelist
                return;
            } else {
                if (typeof updateObj.target.value === 'object') {
                    // Fix an issue when a blank values appreas when keyboard is used
                    // TODO: Investigate issue, see https://trello.com/c/GVhBqI4W/65
                    result[index].selectedValues = updateObj.target.value.filter(value => value !== '');
                } else {
                    result[index].selectedValues = [updateObj.target.value];
                }
            }
            // In case of a regular expression, verify it is valid
            result[index].regexIsValid = true;
            if (result[index].comparator.startsWith('REGEX')) {
                try {
                    RegExp(result[index].selectedValues[0]);
                } catch (e) {
                    result[index].regexIsValid = false;
                }
            }
            // If dataset is selected, update possible values
            if (result[index].field === 'dataset') {
                let newValues = this.getValuesForItemGroups(result[index].selectedValues);
                newValues.dataset = this.state.values.dataset;
                // Add values from existing conditions
                this.state.conditions.forEach(condition => {
                    if (['IN', 'NOTIN', 'EQ', 'NE'].includes(condition.comparator)) {
                        condition.selectedValues.forEach(selectedValue => {
                            if (!newValues[condition.field].includes(selectedValue)) {
                                newValues[condition.field].push(selectedValue);
                            }
                        });
                    }
                });
                this.setState({
                    conditions: result,
                    values: newValues,
                });
            } else {
                this.setState({
                    conditions: result,
                });
            }
        } else if (name === 'addRangeCheck') {
            let newIndex = result.length;
            let connectors = this.state.connectors.slice();
            connectors.push(connector);
            result[newIndex] = {};
            // Reset all other values
            result[newIndex].field = 'name';
            result[newIndex].comparator = 'IN';
            result[newIndex].selectedValues = [''];
            result[newIndex].regexIsValid = true;
            this.setState({
                conditions: result,
                connectors,
            });
        } else if (name === 'switchConnector') {
            let connectors = this.state.connectors.slice();
            connectors[index - 1] = connectors[index - 1] === 'AND' ? 'OR' : 'AND';
            this.setState({
                connectors,
            });
        } else if (name === 'deleteRangeCheck') {
            let connectors = this.state.connectors.slice();
            result.splice(index, 1);
            if (index !== 0) {
                connectors.splice(index - 1, 1);
            }
            this.setState({
                conditions: result,
                connectors,
            });
        }
    }

    getValuesForItemGroups = itemGroupNames => {
        // Get itemGroupOids from name
        let itemGroupOids = [];
        Object.keys(this.props.mdv.itemGroups).forEach(itemGroupOid => {
            if (itemGroupNames.includes(this.props.mdv.itemGroups[itemGroupOid].name)) {
                itemGroupOids.push(itemGroupOid);
            }
        });
        // Default values
        let values = {};
        Object.keys(filterFields).forEach(field => {
            values[field] = [];
        });
        // Extract values for each dataset
        itemGroupOids.forEach(itemGroupOid => {
            let itemGroupValues = this.getValues(itemGroupOid);
            Object.keys(itemGroupValues).forEach(field => {
                if (values.hasOwnProperty(field)) {
                    itemGroupValues[field].forEach(value => {
                        if (!values[field].includes(value)) {
                            values[field].push(value);
                        }
                    });
                } else {
                    values[field] = itemGroupValues[field];
                }
            });
        });
        return values;
    }

    getData = (itemGroupOid) => {
        const mdv = this.props.mdv;
        const dataset = mdv.itemGroups[itemGroupOid];
        // Get variable level metadata
        let variables = getTableDataAsText({
            source: dataset,
            datasetName: dataset.name,
            datasetOid: dataset.oid,
            itemDefs: mdv.itemDefs,
            codeLists: mdv.codeLists,
            mdv: mdv,
            defineVersion: this.props.defineVersion,
            vlmLevel: 0,
        });

        variables
            .filter(item => (item.valueListOid !== undefined))
            .forEach(item => {
                let vlmData = getTableDataAsText({
                    source: mdv.valueLists[item.valueListOid],
                    datasetName: dataset.name,
                    datasetOid: dataset.oid,
                    itemDefs: mdv.itemDefs,
                    codeLists: mdv.codeLists,
                    mdv: mdv,
                    defineVersion: this.props.defineVersion,
                    vlmLevel: 1,
                });
                let startIndex = variables.map(item => item.oid).indexOf(item.oid) + 1;
                variables.splice.apply(variables, [startIndex, 0].concat(vlmData));
            });

        return variables;
    }

    getValues = (itemGroupOid) => {
        let data = this.getData(itemGroupOid);
        let values = {};
        Object.keys(filterFields)
            .filter(field => (field !== 'dataset'))
            .forEach(field => {
                let allValues = data.map(row => row[field]);
                values[field] = [];
                allValues.forEach(value => {
                    if (!values[field].includes(value)) {
                        values[field].push(value);
                    }
                });
            });
        return values;
    }

    enable = () => {
        this.props.updateFilter({ isEnabled: true, conditions: this.state.conditions, connectors: this.state.connectors, applyToVlm: this.state.applyToVlm });
        this.props.onClose();
    }

    disable = () => {
        this.props.updateFilter({ isEnabled: false, conditions: this.state.conditions, connectors: this.state.connectors, applyToVlm: this.state.applyToVlm });
        this.props.onClose();
    }

    save = () => {
        this.props.onUpdate({ isEnabled: true, conditions: this.state.conditions, connectors: this.state.connectors, applyToVlm: this.state.applyToVlm });
        this.props.onClose();
    }

    cancel = () => {
        this.props.onClose();
    }

    getRangeChecks = () => {
        const { classes } = this.props;

        let result = [];
        this.state.conditions.forEach((condition, index) => {
            const multipleValuesSelect = (['IN', 'NOTIN'].indexOf(condition.comparator) >= 0);
            const valueSelect = ['IN', 'NOTIN', 'EQ', 'NE'].indexOf(condition.comparator) >= 0;
            const value = multipleValuesSelect && valueSelect ? condition.selectedValues : condition.selectedValues[0];
            // In case itemGroupOid is provided, exclude dataset from the list of fields
            // Allow dataset only for the first field
            const fields = {};
            Object.keys(filterFields)
                .filter(field => ((!this.props.itemGroupOid && index === 0) || field !== 'dataset'))
                .forEach(field => { fields[field] = filterFields[field].label; })
            ;

            result.push(
                <Grid container spacing={1} key={index} alignItems='flex-end'>
                    {index !== 0 &&
                            [
                                <Grid item xs={12} key='connector' className={classes.connector}>
                                    <Button
                                        color='default'
                                        size='small'
                                        variant='contained'
                                        disabled={index === 1 && this.props.itemGroupOid === undefined}
                                        onClick={this.handleChange('switchConnector', index)}
                                        className={classes.button}
                                    >
                                        {this.state.connectors[index - 1]}
                                    </Button>
                                </Grid>,
                                <Grid item key='deleteButton'>
                                    <IconButton
                                        color='secondary'
                                        onClick={this.handleChange('deleteRangeCheck', index)}
                                        className={classes.button}
                                    >
                                        <RemoveIcon />
                                    </IconButton>
                                </Grid>
                            ]
                    }
                    <Grid item className={index === 0 ? classes.firstRangeCheck : undefined}>
                        <TextField
                            label='Field'
                            fullWidth
                            autoFocus
                            select={true}
                            disabled={condition.field === 'dataset'}
                            value={condition.field}
                            onChange={this.handleChange('field', index)}
                            className={classes.textField}
                        >
                            {getSelectionList(fields)}
                        </TextField>
                    </Grid>
                    <Grid item>
                        <TextField
                            label='Comparator'
                            fullWidth
                            select={true}
                            value={condition.comparator}
                            onChange={this.handleChange('comparator', index)}
                            className={classes.textFieldComparator}
                        >
                            {getSelectionList(comparators[filterFields[condition.field].type])}
                        </TextField>
                    </Grid>
                    { condition.field === 'dataset' ? (
                        <Grid item className={classes.valuesGridItem}>
                            <TextField
                                label='Values'
                                select
                                fullWidth
                                multiline
                                value={value}
                                SelectProps={{ multiple: multipleValuesSelect }}
                                onChange={this.handleChange('selectedValues', index)}
                                className={classes.textFieldValues}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <IconButton
                                                color="default"
                                                onClick={this.handleChange('selectAllValues', index)}
                                            >
                                                <DoneAll />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            >
                                {getSelectionList(this.state.values[condition.field], this.state.values[condition.field].length === 0)}
                            </TextField>
                        </Grid>
                    ) : (
                        valueSelect ? (
                            <Grid item className={classes.valuesGridItem}>
                                <TextField
                                    label='Values'
                                    select
                                    fullWidth
                                    multiline
                                    value={value}
                                    SelectProps={{ multiple: multipleValuesSelect }}
                                    onChange={this.handleChange('selectedValues', index)}
                                    className={classes.textFieldValues}
                                >
                                    {getSelectionList(this.state.values[condition.field], this.state.values[condition.field].length === 0)}
                                </TextField>
                            </Grid>
                        ) : (
                            <Grid item>
                                <TextField
                                    label='Value'
                                    fullWidth
                                    multiline
                                    error={!condition.regexIsValid}
                                    defaultValue={value}
                                    onChange={this.handleChange('selectedValues', index)}
                                    className={classes.textFieldValues}
                                />
                            </Grid>
                        )
                    )}
                </Grid>
            );
        });
        result.push(
            <Grid container spacing={1} key='buttonLine' alignItems='flex-end' className={classes.connector}>
                <Grid item xs={12} className={classes.buttonLine}>
                    <Button
                        color='primary'
                        size='small'
                        variant='contained'
                        onClick={this.handleChange('addRangeCheck', 0, 'AND')}
                        className={classes.button}
                    >
                       AND
                    </Button>
                    <Button
                        color='primary'
                        size='small'
                        variant='contained'
                        disabled={this.props.itemGroupOid === undefined && this.state.conditions.length === 1}
                        onClick={this.handleChange('addRangeCheck', 0, 'OR')}
                        className={classes.button}
                    >
                       OR
                    </Button>
                </Grid>
            </Grid>
        );
        return result;
    }

    render () {
        const { classes } = this.props;
        // Check if any of the conditions has an invalid regex
        const hasInvalidRegex = this.state.conditions.some(condition => (!condition.regexIsValid));

        return (
            <Dialog
                disableBackdropClick
                disableEscapeKeyDown
                open
                fullWidth
                maxWidth={false}
                PaperProps={{ className: classes.dialog }}
            >
                <DialogTitle className={classes.title} disableTypography>
                    Filter
                    <InternalHelp data={VARIABLE_FILTER} />
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} alignItems='flex-end'>
                        {this.getRangeChecks()}
                        <Grid item xs={12}>
                            <FormControl component="fieldset">
                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={this.state.applyToVlm}
                                                onChange={() => { this.setState({ applyToVlm: !this.state.applyToVlm }); }}
                                                color='primary'
                                            />
                                        }
                                        label='Apply Filter to VLM'
                                    />
                                </FormGroup>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} className={classes.controlButtons}>
                            <Grid container spacing={2} justify='flex-start'>
                                { this.props.onUpdate === undefined ? (
                                    <React.Fragment>
                                        <Grid item>
                                            <Button
                                                color='primary'
                                                size='small'
                                                onClick={this.enable}
                                                variant='contained'
                                                disabled={hasInvalidRegex}
                                                className={classes.button}
                                            >
                                                Enable
                                            </Button>
                                        </Grid>
                                        <Grid item>
                                            <Button
                                                color='default'
                                                size='small'
                                                onClick={this.disable}
                                                variant='contained'
                                                className={classes.button}
                                            >
                                                Disable
                                            </Button>
                                        </Grid>
                                    </React.Fragment>
                                ) : (
                                    <Grid item>
                                        <Button
                                            color='primary'
                                            size='small'
                                            onClick={this.save}
                                            variant='contained'
                                            disabled={hasInvalidRegex}
                                            className={classes.button}
                                        >
                                            Save
                                        </Button>
                                    </Grid>
                                )}
                                <Grid item>
                                    <Button
                                        color='secondary'
                                        size='small'
                                        onClick={this.cancel}
                                        variant='contained'
                                        className={classes.button}
                                    >
                                        Cancel
                                    </Button>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </DialogContent>
            </Dialog>
        );
    }
}

ConnectedVariableTabFilter.propTypes = {
    classes: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired,
    mdv: PropTypes.object.isRequired,
    itemGroupOid: PropTypes.string,
    defineVersion: PropTypes.string.isRequired,
    tabSettings: PropTypes.object.isRequired,
    filter: PropTypes.object.isRequired,
    updateFilter: PropTypes.func.isRequired,
    onUpdate: PropTypes.func,
};

const VariableTabFilter = connect(mapStateToProps, mapDispatchToProps)(ConnectedVariableTabFilter);
export default withStyles(styles)(VariableTabFilter);
