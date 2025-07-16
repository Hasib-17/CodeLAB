const usbDetect = require('usb-detection');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 👇 Backend URL:
const BACKEND_API = "http://localhost:3000/api/log-usb-event";

// read saved userId from file
function getCurrentUserId() {
    try {
        const filePath = path.join(__dirname, 'current-user.txt');
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, 'utf8').trim();
        }
    } catch (e) {
        console.error('Failed to read current-user.txt:', e.message);
    }
    return null;
}

usbDetect.startMonitoring();

usbDetect.on('add', device => {
    const studentId = getCurrentUserId();
    if (!studentId) {
        console.log('No userId found. Skipping log.');
        return;
    }
    console.log('USB inserted:', device);
    axios.post(BACKEND_API, {
        studentId,
        event: 'usb-inserted',
        time: new Date().toISOString(),
        locationId: device.locationId,
        vendorId: device.vendorId,
        productId: device.productId,
        deviceName: device.deviceName,
        manufacturer: device.manufacturer,
        serialNumber: device.serialNumber,
        deviceAddress: device.deviceAddress
    }).catch(err => console.error('Failed to send insert event:', err.message));
});

usbDetect.on('remove', device => {
    const studentId = getCurrentUserId();
    if (!studentId) {
        console.log('No userId found. Skipping log.');
        return;
    }
    console.log('USB removed:', device);
    axios.post(BACKEND_API, {
        studentId,
        event: 'usb-removed',
        time: new Date().toISOString(),
        locationId: device.locationId,
        vendorId: device.vendorId,
        productId: device.productId,
        deviceName: device.deviceName,
        manufacturer: device.manufacturer,
        serialNumber: device.serialNumber,
        deviceAddress: device.deviceAddress
    }).catch(err => console.error('Failed to send remove event:', err.message));
});

console.log("USB detector service running...");
