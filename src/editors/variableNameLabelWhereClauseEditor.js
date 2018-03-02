import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import Grid from 'material-ui/Grid';
import VariableNameLabelEditor from 'editors/variableNameLabelEditor.js';
import VariableWhereClauseEditor from 'editors/variableWhereClauseEditor.js';
import SaveCancel from 'editors/saveCancel.js';
import CommentEditor from 'editors/commentEditor.js';
import {WhereClause, RangeCheck} from 'elements.js';

const styles = theme => ({
    gridItem: {
    },
});

let wcRegex = {
    variable                : new RegExp('(?:\\w+\\.)?\\w+'),
    variableParse           : new RegExp('((?:\\w+\\.)?\\w+)'),
    datasetVariableParse    : new RegExp('(\\w+)\\.(\\w+)'),
    item                    : new RegExp('\\s*(?:["][^"]+["]|[\'][^\']+[\']|[^\'",][^,\\s]*)\\s*'),
    itemParse               : new RegExp('\\s*(["][^"]+["]|[\'][^\']+[\']|[^\',"][^,\\s]*)\\s*'),
    comparatorSingle        : new RegExp('(?:eq|ne|lt|gt|ge)'),
    comparatorSingleParse   : new RegExp('(eq|ne|lt|gt|ge)'),
    comparatorMultiple      : new RegExp('(?:in|notin)'),
    comparatorMultipleParse : new RegExp('(in|notin)'),
};


wcRegex.rangeCheck = new RegExp(
    wcRegex.variable.source + '\\s+(?:'
    + wcRegex.comparatorSingle.source + '\\s+' + wcRegex.item.source
    + '|' + wcRegex.comparatorMultiple.source + '\\s+\\('
    + wcRegex.item.source + '(?:,' + wcRegex.item.source + ')*\\))'
    ,'i'
);

wcRegex.rangeCheckExtract = new RegExp('(' + wcRegex.rangeCheck.source + ')' ,'i');

wcRegex.rangeCheckParse = new RegExp(
    wcRegex.variableParse.source + '\\s+(?:'
    + wcRegex.comparatorSingleParse.source + '\\s+' + wcRegex.itemParse.source
    + '|' + wcRegex.comparatorMultipleParse.source + '\\s+\\(('
    + wcRegex.item.source + '(?:,' + wcRegex.item.source + ')*)\\))'
    ,'i'
);

wcRegex.whereClause = new RegExp(
    '^(' + wcRegex.rangeCheck.source + ')(?:\\s+and\\s+(' + wcRegex.rangeCheck.source + '))*$'
    , 'i'
);


class VariableNameLabelWhereClauseEditor extends React.Component {
    constructor (props) {
        super(props);
        const autoLabel = this.props.defaultValue.label === undefined && this.props.blueprint !== undefined ? true : false;

        this.state = {
            name          : this.props.defaultValue.name || '',
            label         : this.props.defaultValue.label || '',
            autoLabel     : autoLabel,
            whereClause   : this.props.defaultValue.whereClause,
            wcEditingMode : 'interactive',
        };
    }

    handleChange = name => updateObj => {
        if (name === 'whereClauseManual') {
            this.setWhereClauseManual(updateObj.target.value);
        } else if (name === 'wcEditingMode') {
            if (updateObj.target.checked === true) {
                this.setState({ [name]: 'interactive' });
            } else {
                this.setState({ [name]: 'manual' });
            }
        } else if (name === 'whereClauseInteractive') {
            let rangeChecks = [];
            updateObj.forEach( rawRangeCheck => {
                rangeChecks.push(new RangeCheck(rawRangeCheck));
            });
            this.setState({
                whereClause: new WhereClause({
                    oid         : this.state.whereClause.oid,
                    comment     : this.state.whereClause.comment,
                    rangeChecks : rangeChecks,
                })
            });
        } else if (name === 'comment') {
            this.setState({
                whereClause: new WhereClause({
                    oid         : this.state.whereClause.oid,
                    comment     : updateObj,
                    rangeChecks : this.state.whereClause.rangeChecks,
                })
            });
        } else if (name === 'autoLabel') {
            this.setState({ [name]: !this.state.autoLabel });
        } else {
            this.setState({ [name]: updateObj.target.value });
        }
    }

    setAutoLabel = () => {
        let bpItemDefs = this.props.blueprint.itemDefs;
        Object.keys(bpItemDefs).forEach( itemDefOid => {
            if (bpItemDefs[itemDefOid].name === this.state.name) {
                this.setState({ label: bpItemDefs[itemDefOid].getDescription() });
                return;
            }
        });
    }

    validateWhereClause = (whereClauseLine) => {
        // Quick Check
        if (wcRegex.whereClause.test(whereClauseLine) === false) {
            return false;
        }
        let result = false;
        // Detailed check: check that proper variables are specified
        let rawWhereClause = wcRegex.whereClause.exec(whereClauseLine);
        // Remove all undefined range checks (coming from (AND condition) part)
        rawWhereClause = rawWhereClause.filter(element => element !== undefined);
        // If there is more than one range check, extract them one by one;
        let rawRangeChecks = [];
        if (rawWhereClause.length >= 3) {
            let rawRangeCheck;
            let rawRanges = whereClauseLine;
            let nextRangeCheckRegex = new RegExp(wcRegex.rangeCheck.source + '(?:AND)?(.*)$','i');
            while ((rawRangeCheck = wcRegex.rangeCheckExtract.exec(rawRanges)) !== null) {
                rawRangeChecks.push(rawRangeCheck[1]);
                rawRanges = rawRanges.replace(nextRangeCheckRegex, '$1');
            }
        } else {
            // Only 1 range check is provided;
            rawRangeChecks.push(rawWhereClause[1]);
        }
        // Extract variable names
        rawRangeChecks.forEach( rawRangeCheck => {
            let rangeCheckElements = wcRegex.rangeCheckParse.exec(rawRangeCheck).slice(1);
            // Remove all undefined elements (come from the (in|notin) vs (eq,ne,...) fork)
            rangeCheckElements = rangeCheckElements.filter(element => element !== undefined);
            let itemOid, itemGroupOid;
            if (/\./.test(rangeCheckElements[0])) {
                // If variable part contains dataset name;
                itemGroupOid = this.props.mdv.getOidByName('itemGroups',rangeCheckElements[0].replace(wcRegex.datasetVariableParse,'$1'));
                if (itemGroupOid !== undefined) {
                    itemOid = this.props.mdv.itemGroups[itemGroupOid].getOidByName(rangeCheckElements[0].replace(wcRegex.datasetVariableParse,'$2'));
                }
            } else {
                // If variable part does not contain dataset name, use the current dataset;
                itemGroupOid = this.props.dataset.oid;
                if (itemGroupOid !== undefined) {
                    itemOid = this.props.mdv.itemGroups[itemGroupOid].getOidByName(rangeCheckElements[0]);
                }
            }
            if (itemOid !== undefined && itemGroupOid !== undefined) {
                result = true;
            }
        });
        return result;
    }

    getOidByName (source, name) {
        let result;
        Object.keys(source).some( oid => {
            if (source[oid].name.toLowerCase() === name.toLowerCase()) {
                result = oid;
                return true;
            }
        });
        return result;
    }

    setWhereClauseManual = (whereClauseLine) => {
        // Do nothing if the where clause in invalid;
        if (!this.validateWhereClause(whereClauseLine)) {
            return;
        }
        // Remove all new line characters
        whereClauseLine = whereClauseLine.replace(/[\r\n\t]/g,' ');
        // Extract raw range checks
        let rawWhereClause = wcRegex.whereClause.exec(whereClauseLine);
        // Remove all undefined range checks (coming from (AND condition) part)
        rawWhereClause = rawWhereClause.filter(element => element !== undefined);
        // If there is more than one range check, extract them one by one;
        let rawRangeChecks = [];
        if (rawWhereClause.length >= 3) {
            let rawRangeCheck;
            let rawRanges = whereClauseLine;
            let nextRangeCheckRegex = new RegExp(wcRegex.rangeCheck.source + '(?:AND)?(.*)$','i');
            while ((rawRangeCheck = wcRegex.rangeCheckExtract.exec(rawRanges)) !== null) {
                rawRangeChecks.push(rawRangeCheck[1]);
                rawRanges = rawRanges.replace(nextRangeCheckRegex, '$1');
            }
        } else {
            // Only 1 range check is provided;
            rawRangeChecks.push(rawWhereClause[1]);
        }
        // Parse each range check;
        let rangeChecks = [];
        rawRangeChecks.forEach( rawRangeCheck => {
            let rangeCheckElements = wcRegex.rangeCheckParse.exec(rawRangeCheck).slice(1);
            // Remove all undefined elements (come from the (in|notin) vs (eq,ne,...) fork)
            rangeCheckElements = rangeCheckElements.filter(element => element !== undefined);
            let itemOid, itemGroupOid;
            if (/\./.test(rangeCheckElements[0])) {
                // If variable part contains dataset name;
                itemGroupOid = this.props.mdv.getOidByName('itemGroups',rangeCheckElements[0].replace(wcRegex.datasetVariableParse,'$1'));
                if (itemGroupOid !== undefined) {
                    itemOid = this.props.mdv.itemGroups[itemGroupOid].getOidByName(rangeCheckElements[0].replace(wcRegex.datasetVariableParse,'$2'));
                }
            } else {
                // If variable part does not contain dataset name, use the current dataset;
                itemGroupOid = this.props.dataset.oid;
                if (itemGroupOid !== undefined) {
                    itemOid = this.props.mdv.itemGroups[itemGroupOid].getOidByName(rangeCheckElements[0]);
                }
            }
            let comparator = rangeCheckElements[1].toUpperCase();
            // Parse Check values
            let checkValues = [];
            if (['IN','NOTIN'].indexOf(comparator) >= 0) {
                let rawCheckValues = rangeCheckElements[2].trim();
                // Extract values one by one when comparator is IN or NOT IN
                let value;
                let nextValueRegex = new RegExp(wcRegex.item.source + ',?(.*$)');
                while ((value = wcRegex.itemParse.exec(rawCheckValues)) !== null) {
                    checkValues.push(value[1]);
                    rawCheckValues = rawCheckValues.replace(nextValueRegex, '$1').trim();
                }
            } else {
                // Only 1 element is possible for other operators;
                checkValues.push(rangeCheckElements[2].trim());
            }

            // Remove surrounding quotes
            checkValues = checkValues.map( checkValue => {
                if ( /^(["']).*\1$/.test(checkValues) ) {
                    return checkValue.replace(/^(.)(.*)\1$/,'$2');
                } else {
                    return checkValue;
                }
            });
            rangeChecks.push(new RangeCheck({
                comparator   : comparator,
                itemOid      : itemOid,
                itemGroupOid : itemGroupOid,
                checkValues  : checkValues
            }));
        });
        // Create and set the new WhereClause
        this.setState({
            whereClause: new WhereClause({
                oid         : this.state.whereClause.oid,
                comment     : this.state.whereClause.comment,
                rangeChecks : rangeChecks,
            })
        });
    }

    save = () => {
        this.props.onUpdate(this.state);
    }

    cancel = () => {
        this.props.onUpdate(this.props.defaultValue);
    }

    render() {
        const vlmLevel = this.props.row.vlmLevel;

        return (
            <Grid container spacing={8}>
                <Grid item xs={12}>
                    <VariableNameLabelEditor
                        handleChange={this.handleChange}
                        onNameBlur={this.setAutoLabel}
                        label={this.state.label}
                        name={this.state.name}
                        blueprint={this.props.blueprint}
                        autoLabel={this.state.autoLabel}
                    />
                </Grid>
                {vlmLevel > 0 &&
                        <React.Fragment>
                            <Grid item xs={12}>
                                <VariableWhereClauseEditor
                                    handleChange={this.handleChange}
                                    whereClause={this.state.whereClause}
                                    validationCheck={this.validateWhereClause}
                                    wcEditingMode={this.state.wcEditingMode}
                                    dataset={this.props.dataset}
                                    mdv={this.props.mdv}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <CommentEditor
                                    comment={this.state.whereClause.comment}
                                    onUpdate={this.handleChange('comment')}
                                    stateless={true}
                                    leafs={this.props.mdv.leafs}
                                    annotatedCrf={this.props.mdv.annotatedCrf}
                                    supplementalDoc={this.props.mdv.supplementalDoc}
                                />
                            </Grid>
                        </React.Fragment>
                }
                <Grid item xs={12}>
                    <SaveCancel save={this.save} cancel={this.cancel}/>
                </Grid>
            </Grid>
        );
    }
}

VariableNameLabelWhereClauseEditor.propTypes = {
    classes      : PropTypes.object.isRequired,
    defaultValue : PropTypes.object.isRequired,
    onUpdate     : PropTypes.func.isRequired,
    blueprint    : PropTypes.object,
    mdv          : PropTypes.object,
    dataset      : PropTypes.object,
};

export default withStyles(styles)(VariableNameLabelWhereClauseEditor);

