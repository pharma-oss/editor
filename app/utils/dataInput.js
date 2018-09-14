import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import Grid from '@material-ui/core/Grid';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import {
    updateMainUi
} from 'actions/index.js';


const styles = theme => ({
    dialog: {
        paddingLeft: theme.spacing.unit * 2,
        paddingRight: theme.spacing.unit * 2,
        paddingBottom: theme.spacing.unit * 1,
        position: 'absolute',
        borderRadius: '10px',
        border: '2px solid',
        borderColor: 'primary',
        top: '10%',
        transform: 'translate(0%, calc(-10%+0.5px))',
        overflowX: 'auto',
        maxHeight: '80%',
        width: '90%',
        overflowY: 'auto'
    },
    textFieldInput: {
        padding: theme.spacing.unit,
        borderRadius: 4,
        border: '1px solid',
    },
    textFieldRoot: {
        padding: 0,
    },
});

// Redux functions
const mapDispatchToProps = dispatch => {
    return {
        updateMainUi: (updateObj) => dispatch(updateMainUi(updateObj)),
    };
};

const mapStateToProps = state => {
    return {
        mdv           : state.present.odm.study.metaDataVersion,
        defineVersion : state.present.odm.study.metaDataVersion.defineVersion,
    };
};

class ConnectedVariableTabUpdate extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            data: '',
        };
    }

    handleChange = (name) => (updateObj) => {
        if (name === 'input') {
            this.setState({
                data: updateObj.target.value,
            });
        }
    }

    cancel = () => {
        this.props.updateMainUi({ showDataInput: false });
    }

    import = () => {
        this.props.updateMainUi({ showDataInput: false });
    }

    render() {
        const {classes} = this.props;

        return (
            <Dialog
                disableBackdropClick
                disableEscapeKeyDown
                open
                PaperProps={{ className: classes.dialog }}
            >
                <DialogTitle>Input Actual Data Attributes</DialogTitle>
                <DialogContent>
                    <Grid container spacing={16} alignItems='flex-end'>
                        <Grid item xs={12}>
                            <TextField
                                multiline
                                fullWidth
                                rows={20}
                                onChange={this.handleChange}
                                InputProps={{
                                    disableUnderline: true,
                                    classes: {
                                        root: classes.textFieldRoot,
                                        input: classes.textFieldInput,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Grid container spacing={16} justify='flex-start'>
                                <Grid item>
                                    <Button
                                        color='primary'
                                        size='small'
                                        onClick={this.import}
                                        variant='raised'
                                    >
                                        Import
                                    </Button>
                                </Grid>
                                <Grid item>
                                    <Button
                                        color='secondary'
                                        size='small'
                                        onClick={this.cancel}
                                        variant='raised'
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

ConnectedVariableTabUpdate.propTypes = {
    classes       : PropTypes.object.isRequired,
    mdv           : PropTypes.object.isRequired,
    defineVersion : PropTypes.string.isRequired,
    updateMainUi  : PropTypes.func.isRequired,
};

const VariableTabUpdate = connect(mapStateToProps, mapDispatchToProps)(ConnectedVariableTabUpdate);
export default withStyles(styles)(VariableTabUpdate);
