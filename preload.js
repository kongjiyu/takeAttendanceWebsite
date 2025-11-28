const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    login: (username, password, deviceId, deviceModel) => 
        ipcRenderer.invoke('login', username, password, deviceId, deviceModel),
    
    recordAttendance: (token, code, deviceId, deviceModel) => 
        ipcRenderer.invoke('record-attendance', token, code, deviceId, deviceModel),
    
    getDeviceInfo: () => 
        ipcRenderer.invoke('get-device-info'),
    
    getTodayList: (token) => 
        ipcRenderer.invoke('get-today-list', token),
    
    checkForUpdates: () => 
        ipcRenderer.invoke('check-for-updates'),
    
    openUpdateUrl: (url) => 
        ipcRenderer.invoke('open-update-url', url),
    
    onUpdateAvailable: (callback) => 
        ipcRenderer.on('update-available', (event, updateInfo) => callback(updateInfo)),
    
    encryptPassword: (password) => 
        ipcRenderer.invoke('encrypt-password', password),
    
    decryptPassword: (encryptedPassword) => 
        ipcRenderer.invoke('decrypt-password', encryptedPassword)
});
