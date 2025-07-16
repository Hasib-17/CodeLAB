import mongoose from 'mongoose';

const UsbLogSchema = new mongoose.Schema({
    studentId: String,
    event: String,
    time: Date,
    locationId: Number,
    vendorId: Number,
    productId: Number,
    deviceName: String,
    manufacturer: String,
    serialNumber: String,
    deviceAddress: Number,
}, { timestamps: true });

export default mongoose.models.UsbLog || mongoose.model('UsbLog', UsbLogSchema);
