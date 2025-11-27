const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    login: (username, password, deviceId, deviceModel) => 
        ipcRenderer.invoke('login', username, password, deviceId, deviceModel),
    
    recordAttendance: (token, code, deviceId, deviceModel) => 
        ipcRenderer.invoke('record-attendance', token, code, deviceId, deviceModel),
    
    getDeviceInfo: () => 
        ipcRenderer.invoke('get-device-info')
});
