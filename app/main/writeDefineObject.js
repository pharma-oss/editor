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

import fs from 'fs';
import Jszip from 'jszip';
import path from 'path';
import { app } from 'electron';

function writeDefineObject (mainWindow, defineObject, backupFlag, pathToFile, onSaveCallback) {
    let pathToDefines;
    let outputFile;
    if (pathToFile === undefined) {
        pathToDefines = path.join(app.getPath('userData'), 'defines');
        if (backupFlag === true) {
            outputFile = path.join(pathToDefines, 'backup.nogz');
        } else {
            outputFile = path.join(pathToDefines, defineObject.defineId + '.nogz');
        }
    } else {
        pathToDefines = path.dirname(pathToFile);
        outputFile = pathToFile;
    }

    let zip = new Jszip();
    zip.file('odm.json', JSON.stringify(defineObject.odm));
    if (defineObject.hasOwnProperty('tabs')) {
        zip.file('tabs.json', JSON.stringify(defineObject.tabs));
    }
    // Write technical information
    let info = {
        datetime: new Date().toISOString(),
        appVersion: app.getVersion(),
        defineVersion: defineObject.odm.study.metaDataVersion.defineVersion,
        defineId: defineObject.defineId,
        defineName: defineObject.defineName,
        studyId: defineObject.studyId,
        studyName: defineObject.studyName,
    };
    if (defineObject.hasOwnProperty('userName')) {
        info.userName = defineObject.userName;
    } else if (process && process.env) {
        info.userName = process.env.USERNAME || process.env.USER || process.env.user || process.env.username;
    }
    zip.file('info.json', JSON.stringify(info));

    function saveFile () {
        zip
            .generateNodeStream({
                type: 'nodebuffer',
                streamFiles: true,
                compression: 'DEFLATE'
            })
            .pipe(fs.createWriteStream(outputFile))
            .once('finish', () => {
                if (pathToFile) {
                    // File is saved using Save As or Save functionality
                    if (onSaveCallback !== undefined) {
                        onSaveCallback();
                    }
                } else {
                    // File is written to internal storage
                    mainWindow.webContents.send('writeDefineObjectFinished', defineObject.defineId);
                }
            });
    }

    fs.mkdir(pathToDefines, function (err) {
        if (err) {
            if (err.code === 'EEXIST') {
                saveFile();
            } else {
                throw new Error('Failed creating defines folder: ' + pathToDefines);
            }
        } else {
            saveFile();
        }
    });
}

module.exports = writeDefineObject;
