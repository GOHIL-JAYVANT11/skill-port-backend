const express = require('express');
const router = express.Router();
const userController = require('../controllers/User/User.Controller');
const authDeviceMiddleware = require('../middlewares/authDeviceMiddleware');
const upload = require('../middlewares/Upload.middleware');

router.get('/get-profile', authDeviceMiddleware, userController.getProfile);
router.post('/add-education', authDeviceMiddleware, userController.addEducation);
router.put('/update-profile', authDeviceMiddleware, 
    upload.fields([{ name: 'resume', maxCount: 1 }, 
                 { name: 'certificationFiles', maxCount: 10 }, 
                 { name: 'companyLogo', maxCount: 1 }]), userController.updateProfile);
router.delete('/delete-data', authDeviceMiddleware, userController.deleteData);


module.exports = router;
