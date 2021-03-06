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
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { addVariable } from 'actions/index.js';
import { ItemRef, ItemDef } from 'core/defineStructure.js';
import getOid from 'utils/getOid.js';

const styles = theme => ({
    inputField: {
        width: '200px',
    },
    addButton: {
        marginLeft: theme.spacing(2),
        marginTop: theme.spacing(2),
    },
});

// Redux functions
const mapDispatchToProps = dispatch => {
    return {
        addVariable: (source, itemRef, itemDef, orderNumber) => dispatch(addVariable(source, itemRef, itemDef, orderNumber)),
    };
};

const mapStateToProps = state => {
    return {
        defineVersion: state.present.odm.study.metaDataVersion.defineVersion,
        itemDefs: state.present.odm.study.metaDataVersion.itemDefs,
        itemGroups: state.present.odm.study.metaDataVersion.itemGroups,
    };
};

class AddVariableSimpleConnected extends React.Component {
    constructor (props) {
        super(props);
        const maxOrderNum = this.props.itemGroups[this.props.itemGroupOid].itemRefOrder.length + 1;
        this.state = {
            name: '',
            orderNumber: this.props.position || maxOrderNum,
            maxOrderNum: maxOrderNum,
        };
    }

    static getDerivedStateFromProps (nextProps, prevState) {
        let maxOrderNum = nextProps.itemGroups[nextProps.itemGroupOid].itemRefOrder.length + 1;
        if (maxOrderNum !== prevState.maxOrderNum) {
            return ({
                orderNumber: nextProps.position || maxOrderNum,
                maxOrderNum: maxOrderNum,
            });
        } else {
            return null;
        }
    }

    resetState = () => {
        this.setState({
            name: '',
            orderNumber: this.props.itemGroups[this.props.itemGroupOid].itemRefOrder.length + 1,
        });
    }

    handleChange = (name) => (event) => {
        if (name === 'name') {
            this.setState({ [name]: event.target.value.toUpperCase() });
        } else if (name === 'orderNumber') {
            if (event.target.value >= 1 && event.target.value <= this.state.maxOrderNum) {
                this.setState({ [name]: event.target.value });
            }
        }
    }

    onKeyDown = (event) => {
        if (event.ctrlKey && (event.keyCode === 83)) {
            this.handleSaveAndClose();
        }
    }

    handleSaveAndClose = (updateObj) => {
        // Get all possible IDs
        let itemDefOids = Object.keys(this.props.itemDefs);
        let itemRefOids = Object.keys(this.props.itemGroups[this.props.itemGroupOid].itemRefs);
        let itemDefOid = getOid('ItemDef', itemDefOids);
        let itemRefOid = getOid('ItemRef', itemRefOids);
        let itemDef = { ...new ItemDef({
            oid: itemDefOid,
            name: this.state.name,
            sources: {
                itemGroups: [this.props.itemGroupOid],
                valueLists: []
            },
        }) };
        let itemRef = { ...new ItemRef({
            oid: itemRefOid,
            itemOid: itemDefOid,
            mandatory: 'No',
        }) };
        this.props.addVariable({ itemGroupOid: this.props.itemGroupOid }, itemRef, itemDef, this.state.orderNumber);
        this.resetState();
        this.props.onClose();
    }

    render () {
        const { classes } = this.props;

        return (
            <Grid container spacing={1} justify='flex-start' alignItems='flex-start' direction='column' onKeyDown={this.onKeyDown} tabIndex='0'>
                <Grid item>
                    <TextField
                        label='Name'
                        autoFocus
                        value={this.state.name}
                        onChange={this.handleChange('name')}
                        className={classes.inputField}
                    />
                </Grid>
                <Grid item>
                    <TextField
                        label='Position'
                        type='number'
                        InputLabelProps={{ shrink: true }}
                        value={this.state.orderNumber}
                        onChange={this.handleChange('orderNumber')}
                        className={classes.inputField}
                    />
                </Grid>
                <Grid item>
                    <Button
                        onClick={this.handleSaveAndClose}
                        color="default"
                        variant="contained"
                        className={classes.addButton}
                    >
                        Add variable
                    </Button>
                </Grid>
            </Grid>
        );
    }
}

AddVariableSimpleConnected.propTypes = {
    classes: PropTypes.object.isRequired,
    itemGroupOid: PropTypes.string.isRequired,
    itemDefs: PropTypes.object.isRequired,
    itemGroups: PropTypes.object.isRequired,
    defineVersion: PropTypes.string.isRequired,
    position: PropTypes.number,
    onClose: PropTypes.func.isRequired,
};

const AddVariableSimple = connect(mapStateToProps, mapDispatchToProps)(AddVariableSimpleConnected);
export default withStyles(styles)(AddVariableSimple);
