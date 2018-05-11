//import App from './App';
//import CustomCellEditTable from './custom-cell-edit.jsx';
import './index.css';
import 'bootstrap/dist/css/bootstrap.css';
import '../node_modules/react-bootstrap-table/dist/react-bootstrap-table-all.min.css';
import Editor from 'core/editor.js';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from "react-redux";
import store from 'store/odm.js';
const {ipcRenderer} = window.require('electron');

// React tools for development purposes
window.require('electron-react-devtools').install();
window.require('electron-redux-devtools').install();

const sendDefineObject = (error, data) => {
    console.log('received request');
    let odm = store.getState().odm;
    ipcRenderer.send('DefineObject', odm);
}

ipcRenderer.on('sendDefineObjectToMain', sendDefineObject);

ReactDOM.render(
    <Provider store={store}>
        <Editor/>
    </Provider>,
    document.getElementById('root')
);
