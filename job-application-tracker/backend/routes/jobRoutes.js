const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');


router.get('/', auth, jobController.getJobs);


router.post('/', auth, upload.single('resume'), jobController.addJob);


router.put('/:id', auth, upload.single('resume'), jobController.updateJob);

router.delete('/:id', auth, jobController.deleteJob);


router.get('/status/:status', auth, jobController.getJobsByStatus);


router.get('/resume/:id', auth, jobController.downloadResume);


router.get('/stats', auth, jobController.getJobStats);

module.exports = router;
