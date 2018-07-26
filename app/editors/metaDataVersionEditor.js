import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import TextField from '@material-ui/core/TextField';
import EditingControlIcons from 'editors/editingControlIcons.js';

const styles = theme => ({
    metaDataVersion: {
        padding   : 16,
        marginTop : theme.spacing.unit * 3,
        width     : '100%',
        outline   : 'none',
    },
    inputField: {
    },
});

class MetaDataVersionEditor extends React.Component {

    constructor (props) {

        super(props);

        const { mdvAttrs } = this.props;
        this.state = mdvAttrs;
    }

    handleChange = (name) => (event) => {
        this.setState({ [name]: event.target.value });
    }

    save = () => {
        this.props.onSave(this.state);
    }

    cancel = () => {
        this.props.onCancel();
    }

    onKeyDown = (event)  => {
        if (event.key === 'Escape' || event.keyCode === 27) {
            this.cancel();
        } else if (event.ctrlKey && (event.keyCode === 83)) {
            this.save();
        }
    }


    render () {
        const { classes, defineVersion } = this.props;
        return (
            <Paper className={classes.metaDataVersion} elevation={4} onKeyDown={this.onKeyDown} tabIndex='0'>
                <Typography variant="headline" component="h3">
                    Metadata Version
                    <EditingControlIcons onSave={this.save} onCancel={this.cancel}/>
                </Typography>
                <List>
                    <ListItem dense>
                        <TextField
                            label='Name'
                            value={this.state.name}
                            autoFocus
                            fullWidth
                            onChange={this.handleChange('name')}
                            className={classes.inputField}
                        />
                    </ListItem>
                    <ListItem dense>
                        <TextField
                            label='Description'
                            value={this.state.description}
                            fullWidth
                            multiline
                            onChange={this.handleChange('description')}
                            className={classes.inputField}
                        />
                    </ListItem>
                    { defineVersion === '2.1.0' &&
                    <ListItem>
                        <ListItemText primary='Comment' secondary={this.state.comment.getDescription()}/>
                    </ListItem>
                    }
                </List>
            </Paper>
        );
    }
}

MetaDataVersionEditor.propTypes = {
    mdvAttrs      : PropTypes.object.isRequired,
    defineVersion : PropTypes.string.isRequired,
    classes       : PropTypes.object.isRequired,
    onSave        : PropTypes.func.isRequired,
    onCancel      : PropTypes.func.isRequired,
    onHelp        : PropTypes.func,
    onComment     : PropTypes.func,
};

export default withStyles(styles)(MetaDataVersionEditor);