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
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import { ipcRenderer } from 'electron';
import getOid from 'utils/getOid.js';
import AddDefineFormStep1 from 'core/addDefineFormStep1.js';
import AddDefineFormStep2 from 'core/addDefineFormStep2.js';
import AddDefineFormStep3 from 'core/addDefineFormStep3.js';
import { Define } from 'core/mainStructure.js';
import getDefineStats from 'utils/getDefineStats.js';
import {
    addOdm,
    addDefine,
    changePage,
    toggleAddDefineForm,
    updateMainUi,
} from 'actions/index.js';

const styles = theme => ({
    dialog: {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
        paddingBottom: theme.spacing(1),
        position: 'absolute',
        borderRadius: '10px',
        top: '10%',
        transform: 'translate(0%, calc(-10%+0.5px))',
        overflowX: 'none',
        maxHeight: '90%',
        maxWidth: '90%',
        width: 800,
        overflowY: 'auto'
    },
    backButton: {
        marginRight: theme.spacing(1)
    },
    instructions: {
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1)
    }
});

const mapStateToProps = state => {
    let study = {};
    if (state.present.studies.byId.hasOwnProperty(state.present.ui.studies.currentStudyId)) {
        study = state.present.studies.byId[state.present.ui.studies.currentStudyId];
    }
    let removeTrailingSpaces;
    if (state.present.settings.editor) {
        removeTrailingSpaces = state.present.settings.editor.removeTrailingSpacesWhenParsing;
    }
    return {
        study,
        defineForm: state.present.ui.studies.defineForm,
        createdDefineId: state.present.ui.studies.createdDefineId,
        studies: state.present.studies,
        defines: state.present.defines,
        standardNames: state.present.stdConstants.standardNames,
        settings: state.present.settings.define,
        controlledTerminology: state.present.controlledTerminology,
        removeTrailingSpaces,
        pathToLastFile: state.present.ui.main.pathToLastFile,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        toggleAddDefineForm: updateObj => dispatch(toggleAddDefineForm(updateObj)),
        addDefine: updateObj => dispatch(addDefine(updateObj)),
        changePage: updateObj => dispatch(changePage(updateObj)),
        addOdm: odm => dispatch(addOdm(odm)),
        updateMainUi: updateObj => dispatch(updateMainUi(updateObj)),
    };
};

function getSteps () {
    return ['Select Source', 'Configure Define-XML', 'Finish'];
}

class ConnectedAddDefineForm extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            activeStep: 1,
            defineCreationMethod: 'new',
            defineData: null,
            pathToDefineXml: '',
            name: null,
        };
    }

    static getDerivedStateFromProps (nextProps, prevState) {
        if (prevState.activeStep === 1 && nextProps.defineForm === true) {
            if (nextProps.createdDefineId && nextProps.defines.byId[nextProps.createdDefineId]) {
                return ({ name: nextProps.defines.byId[nextProps.createdDefineId].name });
            } else {
                return ({ name: null });
            }
        } else {
            return null;
        }
    }

    saveDefineAsObject = (defineId, defineData, pathToDefineXml) => {
        // Calculate define Stats
        let stats = getDefineStats(defineData);
        let define = {
            ...new Define({
                id: defineId,
                name: defineData.defineName,
                pathToFile: pathToDefineXml,
                stats,
            })
        };
        this.props.addDefine({ define, studyId: this.props.study.id });
        ipcRenderer.once('writeDefineObjectFinished', () => {
            this.setState({
                activeStep: 1,
                defineCreationMethod: 'new',
                defineData: null,
                name: null,
            });
            this.props.toggleAddDefineForm({});
        });
        ipcRenderer.send('writeDefineObject', { odm: defineData, defineId });
    };

    handleNext = data => {
        const { activeStep } = this.state;
        if (activeStep === 1) {
            if (['new', 'copy'].includes(data.defineCreationMethod)) {
                if (this.state.defineCreationMethod !== data.defineCreationMethod) {
                    this.setState({
                        activeStep: 2,
                        defineCreationMethod: data.defineCreationMethod,
                        defineData: null
                    });
                } else {
                    this.setState({
                        activeStep: 2
                    });
                }
            } else if (data.defineCreationMethod === 'import') {
                this.setState({
                    activeStep: 3,
                    defineCreationMethod: 'import',
                    defineData: data.defineData,
                    pathToDefineXml: data.pathToDefineXml,
                });
            }
        } else if (activeStep === 2) {
            if (this.state.defineCreationMethod === 'new') {
                this.setState({
                    activeStep: 3,
                    defineData: data.defineData,
                });
            } else if (this.state.defineCreationMethod === 'copy') {
                this.setState({
                    activeStep: 3,
                    defineData: data.defineData,
                    name: this.props.createdDefineId ? this.state.name : data.name,
                });
            }
        } else if (activeStep === 3) {
            let defineId = this.props.createdDefineId ? this.props.createdDefineId : getOid('Define', this.props.defines.allIds);
            let defineData = this.state.defineData;
            defineData.defineId = defineId;
            defineData.defineName = data;
            this.saveDefineAsObject(defineId, defineData, this.state.pathToDefineXml);
        }
    };

    handleBack = () => {
        const { activeStep } = this.state;
        if (activeStep === 2) {
            this.setState({
                activeStep: 1
            });
        } else if (activeStep === 3) {
            if (['new', 'copy'].includes(this.state.defineCreationMethod)) {
                this.setState({
                    activeStep: 2,
                    name: null,
                    defineData: null,
                });
            } else if (this.state.defineCreationMethod === 'import') {
                this.setState({
                    activeStep: 1
                });
            }
        }
    };

    handleCancel = () => {
        this.setState({
            activeStep: 1,
            defineCreationMethod: 'new',
            defineData: null,
            pathToDefineXml: '',
            name: null,
        }, () => { this.props.toggleAddDefineForm({}); });
    };

    onKeyDown = (event) => {
        if (event.key === 'Escape' || event.keyCode === 27) {
            this.handleCancel();
        }
    }

    render () {
        const { classes } = this.props;
        const steps = getSteps();
        const { activeStep } = this.state;

        return (
            <Dialog
                disableBackdropClick
                disableEscapeKeyDown
                open={this.props.defineForm}
                PaperProps={{ className: classes.dialog }}
                onKeyDown={this.onKeyDown}
                tabIndex='0'
            >
                <DialogTitle>{this.props.createdDefineId ? 'Replace' : 'Add'} Define-XML</DialogTitle>
                <DialogContent>
                    <Stepper activeStep={activeStep - 1}>
                        {steps.map((label, index) => {
                            const props = {};
                            const labelProps = {};
                            return (
                                <Step key={label} {...props}>
                                    <StepLabel {...labelProps}>{label}</StepLabel>
                                </Step>
                            );
                        })}
                    </Stepper>
                    {activeStep === 1 && (
                        <AddDefineFormStep1
                            updateMainUi={this.props.updateMainUi}
                            pathToLastFile={this.props.pathToLastFile}
                            onNext={this.handleNext}
                            onCancel={this.handleCancel}
                            defineCreationMethod={this.state.defineCreationMethod}
                            defineData={this.state.defineData}
                            removeTrailingSpaces={this.props.removeTrailingSpaces}
                        />
                    )}
                    {activeStep === 2 && (
                        <AddDefineFormStep2
                            onNext={this.handleNext}
                            onBack={this.handleBack}
                            onCancel={this.handleCancel}
                            settings={this.props.settings}
                            study={this.props.study}
                            defines={this.props.defines}
                            studies={this.props.studies}
                            defineData={this.state.defineData}
                            standardNames={this.props.standardNames}
                            controlledTerminology={this.props.controlledTerminology}
                            defineCreationMethod={this.state.defineCreationMethod}
                        />
                    )}
                    {activeStep === 3 && (
                        <AddDefineFormStep3
                            onNext={this.handleNext}
                            onBack={this.handleBack}
                            onCancel={this.handleCancel}
                            defineData={this.state.defineData}
                            defineCreationMethod={this.state.defineCreationMethod}
                            name={this.state.name}
                            study={this.props.study}
                            defines={this.props.defines}
                        />
                    )}
                </DialogContent>
            </Dialog>
        );
    }
}

ConnectedAddDefineForm.propTypes = {
    classes: PropTypes.object.isRequired,
    standardNames: PropTypes.object.isRequired,
    study: PropTypes.object.isRequired,
    studies: PropTypes.object.isRequired,
    defines: PropTypes.object.isRequired,
    settings: PropTypes.object.isRequired,
    controlledTerminology: PropTypes.object.isRequired,
    defineForm: PropTypes.bool.isRequired,
    toggleAddDefineForm: PropTypes.func.isRequired,
    removeTrailingSpaces: PropTypes.bool,
    pathToLastFile: PropTypes.string,
    updateMainUi: PropTypes.func.isRequired,
    createdDefineId: PropTypes.string,
};

const AddDefineForm = connect(mapStateToProps, mapDispatchToProps)(
    ConnectedAddDefineForm
);
export default withStyles(styles)(AddDefineForm);
