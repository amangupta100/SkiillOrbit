const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  logo: {
    type: {
      data: String, // Base64 encoded string
      contentType: String, // MIME type (e.g., 'image/jpeg')
      lastModified: Date, // When the image was last updated
    },
    default: null,
  },
  tagline: String,
  websiteURL: {
    type: String,
    match: /^https?:\/\/.+$/, // basic URL validation
  },
  numberOfEmployees: {
    type: String, // e.g., "1-10", "11-50", "51-200"
    enum: [
      "1-10",
      "11-50",
      "51-200",
      "201-500",
      "501-1000",
      "1001-5000",
      "5001-10000",
      "10000+",
    ],
  },
  headquarters: String,
  industryType: {
    type: String, // Can later be converted to an enum or separate collection
  },
  about: String,
  foundedYear: Number,
  companyType: {
    type: String,
    enum: [
      "Product-based",
      "Service-based",
      "Hiring Platform",
      "Recruitment Agency",
      "Startup",
      "Enterprise",
      "Government",
      "NGO",
      "Other",
    ],
  },
  linkedinUrl: {
    type: String,
    match: /^https?:\/\/(www\.)?linkedin\.com\/.+$/,
  },
  location: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Company", companySchema);
