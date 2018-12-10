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
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ArmDescriptionFormatter from 'formatters/armDescriptionFormatter.js';
import ArmProgrammingCodeFormatter from 'formatters/armProgrammingCodeFormatter.js';
import ArmAnalysisDatasetFormatter from 'formatters/armAnalysisDatasetFormatter.js';
import { getWhereClauseAsText, getDescription } from 'utils/defineStructureUtils.js';

const styles = theme => ({
    root: {
        width: '100%',
    },
    firstListItem: {
        paddingTop: 0,
        paddingBottom: 0,
    },
    listItem: {
        paddingTop: 6,
        paddingBottom: 6,
    },
    reason: {
        paddingLeft: 0,
        marginLeft: 0,
        paddingTop: 6,
        paddingBottom: 6,
    },
});

class GlobalVariablesFormatter extends React.Component {

    render () {
        const { classes, analysisResult, mdv } = this.props;
        const { analysisReason, analysisPurpose, parameterOid, documentation, programmingCode, analysisDatasets, analysisDatasetOrder } = analysisResult;
        let parameterName;
        if (mdv.itemDefs.hasOwnProperty(parameterOid)) {
            parameterName = mdv.itemDefs[parameterOid].name;
            // Looks for a where clause which is using this parameter
            Object.values(analysisResult.analysisDatasets).forEach( analysisDataset => {
                if (analysisDataset.whereClauseOid !== undefined && mdv.whereClauses.hasOwnProperty(analysisDataset.whereClauseOid)) {
                    let parameterWhereClause = getWhereClauseAsText(mdv.whereClauses[analysisDataset.whereClauseOid], mdv, { itemOid: parameterOid });
                    if (parameterWhereClause !== undefined && parameterWhereClause !== '') {
                        parameterName = parameterWhereClause;
                    }
                }
            });
        }
        // Parse analysis datasets
        let datasetData = {};
        analysisDatasetOrder.forEach( analysisDatasetOid => {
            const analysisDataset = analysisDatasets[analysisDatasetOid];
            let dsData = {};
            if (mdv.itemGroups.hasOwnProperty(analysisDataset.itemGroupOid)) {
                dsData.itemGroupOid = analysisDataset.itemGroupOid;
                let itemGroup = mdv.itemGroups[analysisDataset.itemGroupOid];
                let description = getDescription(itemGroup);
                if (description !== '') {
                    dsData.datasetName = `${itemGroup.name} (${description})`;
                } else {
                    dsData.datasetName = itemGroup.name;
                }
            }
            if (analysisDataset.whereClauseOid !== undefined && mdv.whereClauses.hasOwnProperty(analysisDataset.whereClauseOid)) {
                dsData.whereClauseText = getWhereClauseAsText(mdv.whereClauses[analysisDataset.whereClauseOid], mdv, { noDatasetName: true });
            }
            dsData.variables = {};
            analysisDataset.analysisVariableOids.forEach( itemDefOid => {
                if (mdv.itemDefs.hasOwnProperty(itemDefOid)) {
                    let itemDef = mdv.itemDefs[itemDefOid];
                    let description = getDescription(itemDef);
                    if (description !== '') {
                        dsData.variables[itemDefOid] = `${mdv.itemDefs[itemDefOid].name} (${description})` ;
                    } else {
                        dsData.variables[itemDefOid] = mdv.itemDefs[itemDefOid].name;
                    }
                }
            });
            datasetData[analysisDataset.itemGroupOid] = dsData;
        });
        // Dataset comment
        let commentText;
        if (analysisResult.analysisDatasetsCommentOid !== undefined && mdv.comments.hasOwnProperty(analysisResult.analysisDatasetsCommentOid)) {
            commentText = getDescription(mdv.comments[analysisResult.analysisDatasetsCommentOid]);
        }

        return (
            <div className={classes.root}>
                <List>
                    <ListItem className={classes.firstListItem}>
                        <Grid container>
                            <Grid item xs={4}>
                                <List>
                                    <ListItem className={classes.reason}>
                                        <ListItemText primary='Reason' secondary={analysisReason}/>
                                    </ListItem>
                                </List>
                            </Grid>
                            <Grid item xs={4}>
                                <List>
                                    <ListItem className={classes.listItem}>
                                        <ListItemText primary='Purpose' secondary={analysisPurpose}/>
                                    </ListItem>
                                </List>
                            </Grid>
                            { parameterName !== undefined && (
                                <Grid item xs={4}>
                                    <List>
                                        <ListItem className={classes.listItem}>
                                            <ListItemText primary='Parameter' secondary={parameterName}/>
                                        </ListItem>
                                    </List>
                                </Grid>
                            )}
                        </Grid>
                    </ListItem>
                    <ListItem className={classes.listItem}>
                        <Grid container spacing={8}>
                            <Grid item xs={12}>
                                <ListItemText primary='Datasets' secondary={commentText || ''}/>
                            </Grid>
                            <Grid item xs={12}>
                                <Grid container spacing={8}>
                                    { Object.keys(datasetData).map( dsOid => (
                                        <Grid key={dsOid} item xs={6}>
                                            <ArmAnalysisDatasetFormatter
                                                key={dsOid}
                                                dsData={datasetData[dsOid]}
                                                selectGroup={this.props.selectGroup}
                                            />
                                        </Grid>
                                    )) }
                                </Grid>
                            </Grid>
                        </Grid>
                    </ListItem>
                    <ListItem className={classes.listItem}>
                        <Grid container spacing={8}>
                            <Grid item xs={12}>
                                <ListItemText primary='Documentation'/>
                            </Grid>
                            <Grid item xs={12}>
                                { documentation !== undefined && <ArmDescriptionFormatter description={documentation} leafs={mdv.leafs} greyText={true}/> }
                            </Grid>
                        </Grid>
                    </ListItem>
                    <ListItem className={classes.listItem}>
                        <Grid container spacing={8}>
                            <Grid item xs={12}>
                                <ListItemText primary='Programming Code'/>
                            </Grid>
                            <Grid item xs={12}>
                                { programmingCode !== undefined  && <ArmProgrammingCodeFormatter programmingCode={programmingCode} leafs={mdv.leafs}/> }
                            </Grid>
                        </Grid>
                    </ListItem>
                </List>
            </div>
        );
    }
}

GlobalVariablesFormatter.propTypes = {
    classes        : PropTypes.object.isRequired,
    analysisResult : PropTypes.object.isRequired,
    mdv            : PropTypes.object.isRequired,
    selectGroup    : PropTypes.func.isRequired,
};

export default withStyles(styles)(GlobalVariablesFormatter);
