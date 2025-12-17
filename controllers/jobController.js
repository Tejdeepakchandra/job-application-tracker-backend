const Job = require('../models/Job');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});


exports.getJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ user: req.user.id }).sort({ appliedDate: -1 });
        res.json({
            success: true,
            count: jobs.length,
            jobs
        });
    } catch (err) {
        console.error('Error fetching jobs:', err.message);
        res.status(500).json({
            success: false,
            msg: 'Server error while fetching jobs'
        });
    }
};


exports.addJob = async (req, res) => {
  try {
    const { company, role, status, notes, contact, source, interviewDate } = req.body;

    const resumePath = req.file ? req.file.path.replace(/\\/g, "/") : null; 

    const newJob = new Job({
      user: req.user.id,
      company,
      role,
      status,
      notes,
      contact,
      source,
      interviewDate: status === 'interview' ? new Date(interviewDate) : null,
      resume: resumePath,
    });

    const job = await newJob.save();

    const user = await User.findById(req.user.id);
    if (user && user.email) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'New Job Application Added',
        text: `You added a job application for ${company} - ${role} with status ${status}.`,
      });
    }

    res.status(201).json({ success: true, job });
  } catch (err) {
    console.error('❌ Error adding job:', err.message);
    res.status(500).json({
      success: false,
      msg: 'Server error while adding job',
    });
  }
};


exports.updateJob = async (req, res) => {
    try {
        const { company, role, status, notes, contact, source, interviewDate } = req.body;
        let job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                msg: 'Job not found'
            });
        }

        if (job.user.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                msg: 'Not authorized to update this job'
            });
        }

        const oldStatus = job.status;

        const resumePath = req.file ? req.file.path : job.resume;

        job = await Job.findByIdAndUpdate(
            req.params.id, {
                company,
                role,
                status,
                notes,
                contact,
                source,
                interviewDate: status === 'interview' ? new Date(interviewDate) : null,
                resume: resumePath,
                lastUpdated: Date.now(),
            }, {
                new: true
            }
        );

        if (oldStatus !== status) {
            const user = await User.findById(req.user.id);
            if (user && user.email) {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: user.email,
                    subject: 'Job Status Updated',
                    text: `The status of your job application for ${company} - ${role} has changed from ${oldStatus} to ${status}.`,
                });
            }
        }

        res.json({
            success: true,
            job
        });
    } catch (err) {
        console.error('Error updating job:', err.message);
        res.status(500).json({
            success: false,
            msg: 'Server error while updating job'
        });
    }
};


exports.deleteJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                msg: 'Job not found'
            });
        }

        if (job.user.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                msg: 'Not authorized to delete this job'
            });
        }

        if (job.resume) {
            const filePath = path.join(__dirname, '..', job.resume);
            fs.unlink(filePath, (err) => {
                if (err) console.error('Error deleting resume file:', err);
            });
        }

        await Job.findByIdAndDelete(req.params.id); 

        res.json({
            success: true,
            msg: 'Job removed successfully'
        });
    } catch (err) {
        console.error('Error deleting job:', err.message);
        res.status(500).json({
            success: false,
            msg: 'Server error while deleting job'
        });
    }
};


exports.getJobsByStatus = async (req, res) => {
    try {
        const jobs = await Job.find({
            user: req.user.id,
            status: req.params.status
        }).sort({ appliedDate: -1 });
        res.json({
            success: true,
            count: jobs.length,
            jobs
        });
    } catch (err) {
        console.error('Error filtering jobs by status:', err.message);
        res.status(500).json({
            success: false,
            msg: 'Server error while filtering jobs'
        });
    }
};


exports.downloadResume = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).json({
                success: false,
                msg: 'Job not found'
            });
        }
        if (job.user.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                msg: 'Not authorized to download this resume'
            });
        }
        if (!job.resume) {
            return res.status(404).json({
                success: false,
                msg: 'Resume not found for this job'
            });
        }

        const filePath = path.join(__dirname, '..', job.resume);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, msg: 'Resume file not found on server.' });
        }

        const fileName = `resume_${job.company}_${job._id}${path.extname(job.resume)}`;
        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error('Error during resume download:', err);
                if (!res.headersSent) { 
                    res.status(500).json({ success: false, msg: 'Error downloading resume file.' });
                }
            }
        });
    } catch (err) {
        console.error('Error downloading resume:', err.message);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                msg: 'Server error while downloading resume'
            });
        }
    }
};


exports.getJobStats = async (req, res) => {
    try {
        const jobs = await Job.find({ user: req.user.id });
        const stats = {
            applied: jobs.filter(j => j.status === 'applied').length,
            interview: jobs.filter(j => j.status === 'interview').length,
            offer: jobs.filter(j => j.status === 'offer').length,
            rejected: jobs.filter(j => j.status === 'rejected').length,
            total: jobs.length
        };
        res.json({
            success: true,
            stats
        });
    } catch (err) {
        console.error('Error getting job stats:', err.message);
        res.status(500).json({
            success: false,
            msg: 'Server error while getting job stats'
        });
    }
};
