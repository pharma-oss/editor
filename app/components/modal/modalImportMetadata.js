/***********************************************************************************
* This file is part of Visual Define-XML Editor. A program which allows to review  *
* and edit XML files created using the CDISC Define-XML standard.                  *
* Copyright (C) 2020 Dmitry Kolosov                                                *
*                                                                                  *
* Visual Define-XML Editor is free software: you can redistribute it and/or modify *
* it under the terms of version 3 of the GNU Affero General Public License         *
*                                                                                  *
* Visual Define-XML Editor is distributed in the hope that it will be useful,      *
* but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY   *
* or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License   *
* version 3 (http://www.gnu.org/licenses/agpl-3.0.txt) for more details.           *
***********************************************************************************/

import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { useDispatch } from 'react-redux';
import { clipboard } from 'electron';
import csv2json from 'csvtojson';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Button from '@material-ui/core/Button';
import AppBar from '@material-ui/core/AppBar';
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import { FaRegCopy as CopyIcon, FaRegClipboard as PasteIcon } from 'react-icons/fa';
import InternalHelp from 'components/utils/internalHelp.js';
import LoadFromXpt from 'components/utils/loadFromXpt.js';
import LoadFromDefine from 'components/utils/loadFromDefine.js';
import convertImportMetadata from 'utils/convertImportMetadata.js';
import MetadataImportTableView from 'components/utils/metadataImportTableView.js';
import { IMPORT_METADATA } from 'constants/help.js';
import {
    openModal,
    closeModal,
    openSnackbar,
    addImportMetadata,
} from 'actions/index.js';

const getStyles = makeStyles(theme => ({
    dialog: {
        position: 'absolute',
        top: '5%',
        maxWidth: 10000,
        height: '90%',
        width: '95%',
        overflowX: 'auto',
        overflowY: 'auto',
        margin: '0 auto',
        borderRadius: '10px',
        border: '2px solid',
        borderColor: 'primary',
        display: 'flex',
    },
    title: {
        backgroundColor: theme.palette.primary.main,
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '1.25rem',
        lineHeight: '1.6',
        letterSpacing: '0.0075em',
        padding: 0,
    },
    firstAppBar: {
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
    },
    helpIcon: {
        marginLeft: theme.spacing(1),
        boxShadow: 'none',
    },
    titleLabel: {
        display: 'none',
        [theme.breakpoints.up('sm')]: {
            display: 'block',
        },
    },
    formatLabel: {
        display: 'none',
        marginLeft: theme.spacing(2),
        [theme.breakpoints.up('sm')]: {
            display: 'block',
        },
    },
    loadLabel: {
        display: 'none',
        marginLeft: theme.spacing(3),
        [theme.breakpoints.up('sm')]: {
            display: 'block',
        },
    },
    content: {
        padding: 0,
        display: 'flex',
    },
    mainContent: {
        padding: '8px 24px',
    },
    layoutSelect: {
        marginLeft: theme.spacing(1),
        width: 80,
    },
    button: {
        marginLeft: theme.spacing(1),
    },
    clipboardIcon: {
        color: '#E0E0E0',
        marginLeft: theme.spacing(1),
    },
    grow: {
        flexGrow: 1,
    },
    color: {
        color: '#E0E0E0',
    },
    select: {
        marginTop: 2,
        fontSize: 20,
    },
}));

const json2csv = (json, delimiter) => {
    let attrs = Object.keys(json[0]);
    let result = [attrs.join(delimiter)];
    json.forEach(obs => {
        // Escape values with delimiters
        result.push(Object.values(obs)
            .map(value => {
                if (value.includes(delimiter)) {
                    return '"' + value.replace('"', '""') + '"';
                } else {
                    return value;
                }
            })
            .join(delimiter)
        );
    });
    return result.join('\n');
};

const convertLayout = async (data, layout, newLayout) => {
    try {
        if (data === '' || (typeof data === 'object' && Object.keys(data).length === 0)) {
            return newLayout === 'table' ? [] : '';
        } else if (['csv', 'excel'].includes(layout)) {
            const delimiter = layout === 'csv' ? ',' : '\t';
            const jsonData = await csv2json({ delimiter }).fromString(data);
            if (jsonData.length === 0) {
                // Did not convert
                throw new Error('Failed to convert');
            }
            if (newLayout === 'table') {
                return jsonData;
            } else {
                const newDelimiter = newLayout === 'csv' ? ',' : '\t';
                return json2csv(jsonData, newDelimiter);
            }
        } else if (layout === 'table') {
            const newDelimiter = newLayout === 'csv' ? ',' : '\t';
            return json2csv(data, newDelimiter);
        }
    } catch (error) {
        return false;
    }
};

const tabNames = ['datasets', 'variables', 'codeLists', 'codedValues'];
const tabLabels = ['Datasets', 'Variables', 'Codelists', 'Coded Values'];
let placeholders = {
    datasets: 'dataset,label,class, ...\nADSL,Subject Level Analysis Dataset,ADSL,...\nADLB,Laboratory Analysis Laboratory Dataset,BDS,...',
    variables: 'dataset,variable,length,...\nADSL,AVAL,20,...\nADSL,AVAL.AST,8,...',
    codeLists: 'codelist,type,dataType,...\nNo Yes Response,decoded,text,...\nRace,decoded,text,...',
    codedValues: 'codelist,codedValue,decode,...\nNo Yes Response,Y,Yes,...\nNo Yes Response,N,No,...',
};

const ModalImportMetadata = (props) => {
    const dispatch = useDispatch();
    let classes = getStyles();

    const [varData, setVarData] = useState('');
    const [dsData, setDsData] = useState('');
    const [codeListData, setCodeListData] = useState('');
    const [codedValueData, setCodedValueData] = useState('');
    const [showXptLoad, setShowXptLoad] = useState(false);
    const [showDefineLoad, setShowDefineLoad] = useState(false);

    const [currentTab, setCurrentTab] = useState(props.tab || 'variables');
    const handleTabChange = (event, newTab) => {
        setCurrentTab(newTab);
    };

    let currentData = [dsData, varData, codeListData, codedValueData][tabNames.indexOf(currentTab)];
    const handleChange = (event) => {
        let currentSetter = [setDsData, setVarData, setCodeListData, setCodedValueData][tabNames.indexOf(currentTab)];
        currentSetter(event.target.value);
    };

    const handleClose = () => {
        dispatch(closeModal({ type: props.type }));
    };

    const onKeyDown = (event) => {
        if (event.key === 'Escape' || event.keyCode === 27) {
            handleClose();
        }
    };

    const handleImportMetadata = async () => {
        let metadata = {
            dsData: await convertLayout(dsData, layout, 'table'),
            varData: await convertLayout(varData, layout, 'table'),
            codeListData: await convertLayout(codeListData, layout, 'table'),
            codedValueData: await convertLayout(codedValueData, layout, 'table')
        };
        let convertedMetadata;
        try {
            convertedMetadata = convertImportMetadata(metadata);
            dispatch(addImportMetadata(convertedMetadata));
            dispatch(closeModal({ type: props.type }));
        } catch (error) {
            dispatch(openModal({
                type: 'GENERAL',
                props: {
                    title: 'Failed Import',
                    markdown: true,
                    message: 'Check your are using a correct **Format** option and the metadata is properly structured.\n\nError message(s):\n\n' + error.message
                }
            }));
        }
    };

    const handleXptFinish = async (varData, dsData, codedValueData) => {
        setShowXptLoad(false);
        if (layout !== 'csv') {
            setVarData(await convertLayout(varData, 'csv', layout));
            setDsData(await convertLayout(dsData, 'csv', layout));
            setCodedValueData(await convertLayout(codedValueData, 'csv', layout));
        } else {
            setVarData(varData);
            setDsData(dsData);
            setCodedValueData(codedValueData);
        }
    };

    const handleDefineFinish = async (varData, dsData, codeListData, codedValueData) => {
        setShowDefineLoad(false);
        if (layout !== 'csv') {
            setVarData(await convertLayout(varData, 'csv', layout));
            setDsData(await convertLayout(dsData, 'csv', layout));
            setCodeListData(await convertLayout(codeListData, 'csv', layout));
            setCodedValueData(await convertLayout(codedValueData, 'csv', layout));
        } else {
            setVarData(varData);
            setDsData(dsData);
            setCodeListData(codeListData);
            setCodedValueData(codedValueData);
        }
    };

    const copyToClipboard = () => {
        if (layout === 'table') {
            clipboard.writeText(JSON.toString(currentData));
        } else {
            clipboard.writeText(currentData);
        }
    };

    const pasteFromClipboard = () => {
        // Remove all blank lines
        if (layout !== 'table') {
            let data = clipboard.readText();
            let delimiter = layout === 'csv' ? ',' : '\t';
            // Get number of attributes
            let attNum = (data.slice(0, data.indexOf('\n')).match(new RegExp(delimiter, 'g')) || []).length;
            data = data.replace(new RegExp(`^${delimiter}{${attNum}}$`, 'gm'), '');
            // Remove newlines at the end
            data = data.replace(/\n*$/, '');
            setVarData(data);
        } else {
            setVarData(clipboard.readText());
        }
    };

    const [layout, setLayout] = useState('excel');
    const handleLayout = async (event) => {
        let data = [dsData, varData, codeListData, codedValueData];
        let convertedData = [];
        let conversionFailed = false;
        let newLayout = event.target.value;
        for (let index = 0; index < data.length; index++) {
            let sourceData = data[index];
            if (
                (typeof sourceData === 'string' && sourceData.length > 0) ||
                (typeof sourceData === 'object' && Object.keys(sourceData).length > 0)
            ) {
                // Data is not blank
                let newData = await convertLayout(sourceData, layout, newLayout);
                if (newData === false) {
                    conversionFailed = true;
                } else {
                    convertedData.push(newData);
                }
            } else {
                // Data is blank
                convertedData.push(newLayout === 'table' ? [] : '');
            }
        }
        // Check if any of the data tabs failed during conversion
        if (conversionFailed) {
            dispatch(
                openSnackbar({
                    type: 'error',
                    message: 'Invalid data',
                })
            );
        } else {
            let setters = [setDsData, setVarData, setCodeListData, setCodedValueData];
            convertedData.forEach((convData, index) => {
                setters[index](convData);
            });
            setLayout(newLayout);
        }
    };

    let placeholder = placeholders[currentTab];
    if (layout !== 'csv') {
        placeholder = placeholder.replace(/,/g, '\t');
    }

    return (
        <React.Fragment>
            <Dialog
                disableBackdropClick
                disableEscapeKeyDown
                open
                PaperProps={{ className: classes.dialog }}
                onKeyDown={onKeyDown}
                tabIndex='0'
            >
                <DialogTitle className={classes.title} disableTypography>
                    <AppBar position="relative" className={classes.firstAppBar}>
                        <Toolbar variant="dense">
                            <Typography className={classes.titleLabel} variant="h6" noWrap>
                                Import Metadata
                                <InternalHelp data={IMPORT_METADATA} buttonClass={classes.helpIcon} />
                            </Typography>
                            <Typography className={classes.formatLabel} variant="h6" noWrap>
                                Format:
                            </Typography>
                            <TextField
                                value={layout}
                                onChange={handleLayout}
                                className={classes.layoutSelect}
                                select
                                margin='dense'
                                InputProps={{
                                    disableUnderline: true,
                                }}
                                SelectProps={{
                                    className: classes.select,
                                    classes: {
                                        icon: classes.color,
                                        select: classes.color,
                                        root: classes.color,
                                    },
                                }}
                            >
                                <MenuItem key='csv' value={'csv'}>CSV</MenuItem>
                                <MenuItem key='excel' value={'excel'}>Excel</MenuItem>
                                <MenuItem key='table' value={'table'}>Table</MenuItem>
                            </TextField>
                            <Typography className={classes.loadLabel} variant="h6" noWrap>
                                Load From:
                            </Typography>
                            <Button
                                variant='contained'
                                onClick={() => { setShowXptLoad(true); }}
                                color='default'
                                className={classes.button}
                            >
                                XPT
                            </Button>
                            <Button
                                variant='contained'
                                onClick={() => { setShowDefineLoad(true); }}
                                color='default'
                                className={classes.button}
                            >
                                Define
                            </Button>
                            <div className={classes.grow} />
                            <Tooltip
                                title='Copy to clipboard'
                                placement='bottom'
                                enterDelay={700}
                            >
                                <IconButton
                                    onClick={copyToClipboard}
                                    className={classes.clipboardIcon}
                                >
                                    <CopyIcon/>
                                </IconButton>
                            </Tooltip>
                            <Tooltip
                                title='Paste from clipboard'
                                placement='bottom'
                                enterDelay={700}
                            >
                                <IconButton
                                    onClick={pasteFromClipboard}
                                    className={classes.clipboardIcon}
                                >
                                    <PasteIcon/>
                                </IconButton>
                            </Tooltip>
                        </Toolbar>
                    </AppBar>
                    <AppBar position='static' color='default'>
                        <Tabs
                            value={currentTab}
                            onChange={handleTabChange}
                            variant='fullWidth'
                            centered
                            indicatorColor='primary'
                            textColor='primary'
                        >
                            { tabNames.map((tab, index) => {
                                return <Tab value={tab} key={tab} label={tabLabels[index]}/>;
                            })
                            }
                        </Tabs>
                    </AppBar>
                </DialogTitle>
                <DialogContent className={classes.content}>
                    { layout === 'table' && typeof currentData === 'object' ? (
                        <MetadataImportTableView data={currentData} />
                    ) : (
                        <TextField
                            multiline
                            fullWidth
                            value={currentData}
                            className={classes.mainContent}
                            placeholder={placeholder}
                            onChange={handleChange}
                            InputProps={{
                                disableUnderline: true,
                                classes: {
                                    root: classes.textFieldRoot,
                                    input: classes.textFieldInput,
                                },
                            }}
                        />
                    )
                    }
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleImportMetadata} color="primary">
                        Import
                    </Button>
                    <Button onClick={handleClose} color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
            { showXptLoad &&
                    <LoadFromXpt onClose={() => { setShowXptLoad(false); }} onFinish={handleXptFinish}/>
            }
            { showDefineLoad &&
                    <LoadFromDefine onClose={() => { setShowDefineLoad(false); }} onFinish={handleDefineFinish}/>
            }
        </React.Fragment>
    );
};

export default ModalImportMetadata;
