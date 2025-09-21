// controllers/opportunityController.js
const Job = require('../../models/JobModel');
const Internship = require('../../models/InternshipModel');

const getOpportunityById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the ID exists in either Job or Internship collection
    const job = await Job.findById(id).populate('company').populate('createdBy');
    const internship = await Internship.findById(id).populate('company').populate('createdBy');

    if (!job && !internship) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found'
      });
    }

    // Determine which type of opportunity we found
    const opportunity = job || internship;
    const type = job ? 'Job' : 'Internship';

    res.status(200).json({
      success: true,
      data: {
        ...opportunity.toObject(),
        type
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {getOpportunityById}