import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import Button from 'material-ui/Button';
import ExpandMoreIcon from 'material-ui-icons/ExpandMore';
import ExpandLessIcon from 'material-ui-icons/ExpandLess';

const styles = theme => ({
    div: {
        whiteSpace: 'normal',
    },
    expandIcon: {
        marginLeft: theme.spacing.unit,
    }
});

class VariableNameLabelWhereClauseFormatter extends React.Component {
    render() {
        const {classes} = this.props;
        const name = this.props.value.name || '';
        const label = this.props.value.label || '';
        const hasVlm = this.props.hasVlm;
        const state = this.props.state;

        let nameLabel;
        if (label.length > 0) {
            nameLabel = name + ' (' + label + ')';
        } else {
            nameLabel = name;

        }

        return (
            <div className={classes.div}>
                {nameLabel}
                {hasVlm &&
                        <Button
                            variant='fab'
                            mini
                            color='default'
                            onClick={this.props.toggleVlmRow(this.props.itemOid)}
                            className={classes.expandIcon}
                        >
                            {state === 'collaps' ? <ExpandMoreIcon/> : <ExpandLessIcon/>}
                        </Button>

                }
            </div>
        );
    }
}

VariableNameLabelWhereClauseFormatter.propTypes = {
    classes       : PropTypes.object.isRequired,
    value         : PropTypes.object.isRequired,
    defineVersion : PropTypes.string.isRequired,
    itemOid       : PropTypes.string,
    state         : PropTypes.string,
    hasVlm        : PropTypes.bool,
    toggleVlmRow  : PropTypes.func,
};

export default withStyles(styles)(VariableNameLabelWhereClauseFormatter);
