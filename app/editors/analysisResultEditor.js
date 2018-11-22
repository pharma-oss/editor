import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import deepEqual from 'fast-deep-equal';
import clone from 'clone';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import { addDocument, getDescription, setDescription } from 'utils/defineStructureUtils.js';
import SaveCancel from 'editors/saveCancel.js';
import CommentEditor from 'editors/commentEditor.js';
import getSelectionList from 'utils/getSelectionList.js';
import ArmDocumentationView from 'editors/view/armDocumentationView.js';
import ArmProgrammingCodeView from 'editors/view/armProgrammingCodeView.js';
import ArmDatasetReferenceEditor from 'editors/armDatasetReferenceEditor.js';
import { Documentation, ProgrammingCode } from 'core/armStructure.js';
import {
    updateAnalysisResult,
} from 'actions/index.js';

const styles = theme => ({
    root: {
        outline   : 'none',
    },
    paramter: {
        minWidth: '200px',
    },
});

const mapDispatchToProps = dispatch => {
    return {
        updateAnalysisResult: updateObj => dispatch(updateAnalysisResult(updateObj)),
    };
};

const mapStateToProps = state => {
    return {
        mdv          : state.present.odm.study.metaDataVersion,
        stdConstants : state.present.stdConstants,
        lang         : state.present.odm.study.metaDataVersion.lang,
    };
};

class ConnectedAnalysisResultEditor extends React.Component {

    constructor (props) {

        super(props);

        this.rootRef = React.createRef();
        let analysisResult = props.mdv.analysisResultDisplays.analysisResults[props.analysisResultOid];

        const {
            analysisReason,
            analysisPurpose,
            parameterOid,
            documentation,
            programmingCode,
            analysisDatasets,
            analysisDatasetOrder,
            analysisDatasetsCommentOid
        } = analysisResult;

        let listOfVariables = this.getListOfVariables(analysisDatasets);

        let descriptionText = getDescription(analysisResult);

        let analysisDatasetsComment;
        if (analysisDatasetsCommentOid !== undefined && props.mdv.comments.hasOwnProperty(analysisDatasetsCommentOid)) {
            analysisDatasetsComment = props.mdv.comments[analysisDatasetsCommentOid];
        }
        // Extract all where clauses
        let whereClauses = {};
        Object.values(analysisDatasets).forEach( analysisDataset => {
            if (analysisDataset.whereClauseOid !== undefined && props.mdv.whereClauses.hasOwnProperty(analysisDataset.whereClauseOid)) {
                whereClauses[analysisDataset.itemGroupOid] = props.mdv.whereClauses[analysisDataset.whereClauseOid];
            }
        });

        this.state = {
            descriptionText,
            analysisReason,
            analysisPurpose,
            parameterOid,
            documentation,
            programmingCode,
            analysisDatasets,
            analysisDatasetOrder,
            analysisDatasetsComment,
            listOfVariables,
            whereClauses
        };
    }


    getListOfVariables = (analysisDatasets) => {
        let result = [];
        const mdv = this.props.mdv;
        const itemGroups = mdv.itemGroups;
        Object.values(analysisDatasets).forEach( analysisDataset => {
            let itemGroupOid = analysisDataset.itemGroupOid;
            if (itemGroups.hasOwnProperty(itemGroupOid)) {
                let itemGroup = itemGroups[itemGroupOid];
                let datasetName = itemGroup.name;
                itemGroup.itemRefOrder.forEach( itemRefOid => {
                    let itemDef = mdv.itemDefs[itemGroup.itemRefs[itemRefOid].itemOid];
                    if (itemDef.name === 'PARAMCD') {
                        result.unshift({ [itemDef.oid]: datasetName + '.' + itemDef.name });
                    } else {
                        result.push({ [itemDef.oid]: datasetName + '.' + itemDef.name });
                    }
                });
            }
        });
        return result;
    }

    handleChange = (category) => (name) => (updateObj) => {
        if (category === 'main') {
            this.setState({ [name]: updateObj.target.value });
        } else if (category === 'documentation') {
            let newDescriptions;
            let docObj;
            if (this.state.documentation !== undefined) {
                newDescriptions = { descriptions: this.state.documentation.descriptions.slice() };
                docObj = { documents: this.state.documentation.documents };
            }
            if (name === 'textUpdate') {
                setDescription(newDescriptions, updateObj.target.value, this.props.lang);
            } else if (name === 'addDocument') {
                addDocument(docObj);
            } else if (name === 'updateDocument') {
                docObj = updateObj;
            } else if (name === 'addDocumentation') {
                this.setState({ documentation: { ...new Documentation({}) } });
            } else if (name === 'deleteDocumentation') {
                this.setState({ documentation: undefined });
            }

            if (!(['addDocumentation', 'deleteDocumentation'].includes(name))) {
                let updatedDocumentation = { descriptions: newDescriptions.descriptions, documents: docObj.documents };
                this.setState({ documentation: updatedDocumentation });
            }
        } else if (category === 'analysisDatasets') {
            // If datasets were changed, update the list of variables for paramOid selection
            if (updateObj.hasOwnProperty('analysisDatasets')) {
                let listOfVariables = this.getListOfVariables(updateObj.analysisDatasets);
                this.setState({ ...updateObj, listOfVariables });
            } else {
                this.setState({ ...updateObj });
            }
        } else if (category === 'programmingCode') {
            let docObj;
            let code;
            let context;
            if (this.state.programmingCode !== undefined) {
                docObj = { documents: this.state.programmingCode.documents };
                code = this.state.programmingCode.code;
                context = this.state.programmingCode.context;
            }
            if (name === 'contextUpdate') {
                context = updateObj.target.value;
            } else if (name === 'codeUpdate') {
                code = updateObj.target.value;
            } else if (name === 'addDocument') {
                addDocument(docObj);
            } else if (name === 'updateDocument') {
                docObj = updateObj;
            } else if (name === 'addProgrammingCode') {
                this.setState({ programmingCode: { ...new ProgrammingCode({}) } });
            } else if (name === 'deleteProgrammingCode') {
                this.setState({ programmingCode: undefined });
            }

            if (!(['addProgrammingCode', 'deleteProgrammingCode'].includes(name))) {
                let updatedProgrammingCode = { code, context, documents: docObj.documents };
                this.setState({ programmingCode: updatedProgrammingCode });
            }
        } else if (category === 'analysisDatasetsComment') {
            this.setState({ analysisDatasetsComment: updateObj });
        }
    }

    save = () => {
        let analysisResult = clone(this.state);
        let originalAnalysisResult = this.props.mdv.analysisResultDisplays.analysisResults[this.props.analysisResultOid];
        // Pre-process the value
        if (analysisResult.programmingCode !== undefined) {
            if (analysisResult.programmingCode.code === '') {
                analysisResult.programmingCode.code = undefined;
            }
            if (analysisResult.programmingCode.context === '') {
                analysisResult.programmingCode.context = undefined;
            }
        }
        if (analysisResult.analysisDatasetsComment !== undefined) {
            analysisResult.analysisDatasetsCommentOid = analysisResult.analysisDatasetsComment.oid;
        } else {
            analysisResult.analysisDatasetsCommentOid = undefined;
        }
        if (analysisResult.descriptionText === '') {
            analysisResult.descriptions = [];
        } else {
            analysisResult.descriptions = originalAnalysisResult.descriptions.slice();
            setDescription(analysisResult, analysisResult.descriptionText, this.props.lang);
        }
        if (analysisResult.parameterOid === '') {
            analysisResult.parameterOid = undefined;
        }
        // Comments;
        let commentData;
        let originalComment;
        if (originalAnalysisResult.analysisDatasetsCommentOid !== undefined
            && this.props.mdv.comments.hasOwnProperty(originalAnalysisResult.analysisDatasetsCommentOid)) {
            originalComment = this.props.mdv.comments[originalAnalysisResult.analysisDatasetsCommentOid];
        }
        if (analysisResult.analysisDatasetsCommentOid !== originalAnalysisResult.analysisDatasetsCommentOid
            || !deepEqual(this.state.analysisDatasetsComment, originalComment)
        ) {
            commentData = { oldCommentOid: originalAnalysisResult.analysisDatasetsCommentOid, comment: this.state.analysisDatasetsComment };
        }
        // Where Clauses;
        let newWhereClauses = this.state.whereClauses;
        let whereClauseData = {};
        let totalWcChanged = 0;
        let originalWhereClauses = {};
        Object.values(originalAnalysisResult.analysisDatasets).forEach( analysisDataset => {
            if (analysisDataset.whereClauseOid !== undefined && this.props.mdv.whereClauses.hasOwnProperty(analysisDataset.whereClauseOid)) {
                originalWhereClauses[analysisDataset.itemGroupOid] = this.props.mdv.whereClauses[analysisDataset.whereClauseOid];
            }
        });
        // Where clauses which were removed;
        whereClauseData.removed = {};
        Object.keys(originalWhereClauses).forEach( itemGroupOid => {
            if (originalWhereClauses[itemGroupOid] !== undefined && newWhereClauses[itemGroupOid] === undefined) {
                let wcOid = originalWhereClauses[itemGroupOid].oid;
                if (whereClauseData.removed.hasOwnProperty(wcOid)) {
                    whereClauseData.removed[wcOid][this.props.analysisResultOid] = itemGroupOid;
                } else {
                    whereClauseData.removed[wcOid] = { [this.props.analysisResultOid]: itemGroupOid };
                }
            }
        });
        // Added
        whereClauseData.added = {};
        Object.keys(newWhereClauses).forEach( itemGroupOid => {
            if (newWhereClauses[itemGroupOid] !== undefined && originalWhereClauses[itemGroupOid] === undefined) {
                let wcOid = newWhereClauses[itemGroupOid].oid;
                let newWhereClause = newWhereClauses[itemGroupOid];
                // Update sources
                if (newWhereClause.sources.analysisResults !== undefined
                    && newWhereClause.sources.analysisResults.hasOwnProperty(this.props.analysisResultOid)
                    && !newWhereClause.sources.analysisResults[this.props.analysisResultOid].includes(itemGroupOid)
                ) {
                    newWhereClause.sources.analysisResults[this.props.analysisResultOid].push(itemGroupOid);
                } else if (newWhereClause.sources.analysisResults !== undefined
                    && !newWhereClause.sources.analysisResults.hasOwnProperty(this.props.analysisResultOid)
                ) {
                    newWhereClause.sources.analysisResults[this.props.analysisResultOid] = [itemGroupOid];
                } else {
                    newWhereClause.sources.analysisResults = {};
                    newWhereClause.sources.analysisResults[this.props.analysisResultOid] = [itemGroupOid];
                }
                whereClauseData.added[wcOid] = newWhereClause;
            }
        });
        // Changed
        whereClauseData.changed = {};
        Object.keys(newWhereClauses).forEach( itemGroupOid => {
            if (newWhereClauses[itemGroupOid] !== undefined
                && originalWhereClauses[itemGroupOid] !== undefined
                && !deepEqual(newWhereClauses[itemGroupOid], originalWhereClauses[itemGroupOid])
            ) {
                let wcOid = newWhereClauses[itemGroupOid].oid;
                let newWhereClause = newWhereClauses[itemGroupOid];
                // Update sources
                if (newWhereClause.sources.analysisResults !== undefined
                    && newWhereClause.sources.analysisResults.hasOwnProperty(this.props.analysisResultOid)
                    && !newWhereClause.sources.analysisResults[this.props.analysisResultOid].includes(itemGroupOid)
                ) {
                    newWhereClause.sources.analysisResults[this.props.analysisResultOid].push(itemGroupOid);
                } else if (newWhereClause.sources.analysisResults !== undefined
                    && !newWhereClause.sources.analysisResults.hasOwnProperty(this.props.analysisResultOid)
                ) {
                    newWhereClause.sources.analysisResults[this.props.analysisResultOid] = [itemGroupOid];
                } else {
                    newWhereClause.sources.analysisResults = {};
                    newWhereClause.sources.analysisResults[this.props.analysisResultOid] = [itemGroupOid];
                }
                whereClauseData.changed[wcOid] = newWhereClause;
            }
        });
        // Total number of where clauses changed
        totalWcChanged = Object.keys(whereClauseData.removed).length + Object.keys(whereClauseData.added).length + Object.keys(whereClauseData.changed).length;

        if (originalAnalysisResult.analysisDatasetsCommentOid !== undefined
            && this.props.mdv.comments.hasOwnProperty(originalAnalysisResult.analysisDatasetsCommentOid)) {
            originalComment = this.props.mdv.comments[originalAnalysisResult.analysisDatasetsCommentOid];
        }
        if (analysisResult.analysisDatasetsCommentOid !== originalAnalysisResult.analysisDatasetsCommentOid
            || !deepEqual(this.state.analysisDatasetsComment, originalComment)
        ) {
            commentData = { oldCommentOid: originalAnalysisResult.analysisDatasetsCommentOid, comment: this.state.analysisDatasetsComment };
        }

        // Keep only parts which have changed
        for (let prop in analysisResult) {
            if ( ['analysisDatasetsComment','listOfVariables','descriptionText','whereClauses'].includes(prop)
                || deepEqual(analysisResult[prop], originalAnalysisResult[prop])) {
                delete analysisResult[prop];
            }
        }
        if (Object.keys(analysisResult).length > 0 || commentData !== undefined || totalWcChanged > 0) {
            this.props.updateAnalysisResult({
                oid: this.props.analysisResultOid,
                commentData,
                whereClauseData,
                updates: { ... analysisResult },
            });
        }
        this.props.onUpdateFinished();
    }

    onKeyDown = (event)  => {
        if (event.key === 'Escape' || event.keyCode === 27) {
            this.props.onUpdateFinished();
        } else if (event.ctrlKey && (event.keyCode === 83)) {
            this.rootRef.current.focus();
            this.setState({}, this.save);
        }
    }

    render () {
        const { classes } = this.props;
        return (
            <div className={classes.root} onKeyDown={this.onKeyDown} tabIndex='0' ref={this.rootRef}>
                <Grid container spacing={8}>
                    <Grid item xs={12}>
                        <TextField
                            label='Description'
                            value={this.state.descriptionText}
                            autoFocus
                            fullWidth
                            onChange={this.handleChange('main')('descriptionText')}
                            className={classes.inputField}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Grid container justify='space-between' spacing={8}>
                            <Grid item>
                                <TextField
                                    label='Analysis Reason'
                                    value={this.state.analysisReason}
                                    fullWidth
                                    select
                                    onChange={this.handleChange('main')('analysisReason')}
                                >
                                    {getSelectionList(this.props.stdConstants.armAnalysisReason)}
                                </TextField>
                            </Grid>
                            <Grid item>
                                <TextField
                                    label='Analysis Purpose'
                                    value={this.state.analysisPurpose}
                                    fullWidth
                                    select
                                    onChange={this.handleChange('main')('analysisPurpose')}
                                >
                                    {getSelectionList(this.props.stdConstants.armAnalysisPurpose)}
                                </TextField>
                            </Grid>
                            <Grid item>
                                <TextField
                                    label='Parameter'
                                    value={this.state.parameterOid || ''}
                                    fullWidth
                                    select
                                    onChange={this.handleChange('main')('parameterOid')}
                                    className={classes.paramter}
                                >
                                    {getSelectionList(this.state.listOfVariables, true)}
                                </TextField>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={12}>
                        <CommentEditor
                            comment={this.state.analysisDatasetsComment}
                            onUpdate={this.handleChange('analysisDatasetsComment')('update')}
                            stateless={true}
                            title='Datasets Comment'
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <ArmDatasetReferenceEditor
                            analysisDatasets={this.state.analysisDatasets}
                            analysisDatasetOrder={this.state.analysisDatasetOrder}
                            itemGroups={this.props.mdv.itemGroups}
                            itemDefs={this.props.mdv.itemDefs}
                            whereClauses={this.state.whereClauses}
                            onChange={this.handleChange('analysisDatasets')('update')}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <ArmDocumentationView
                            documentation={this.state.documentation}
                            onChange={this.handleChange('documentation')}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <ArmProgrammingCodeView
                            programmingCode={this.state.programmingCode}
                            onChange={this.handleChange('programmingCode')}
                        />
                    </Grid>
                    <Grid item xs={12} >
                        <SaveCancel save={this.save} cancel={this.props.onUpdateFinished}/>
                    </Grid>
                </Grid>
            </div>
        );
    }
}

ConnectedAnalysisResultEditor.propTypes = {
    analysisResultOid : PropTypes.string.isRequired,
    classes           : PropTypes.object.isRequired,
    onUpdateFinished  : PropTypes.func.isRequired,
};

const AnalysisResultEditor = connect(mapStateToProps, mapDispatchToProps)(ConnectedAnalysisResultEditor);
export default withStyles(styles)(AnalysisResultEditor);