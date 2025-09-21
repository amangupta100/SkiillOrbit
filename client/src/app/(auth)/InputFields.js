// formFields.js

export const userLoginFields = [
  {
    label: "Email",
    name: "email",
    type: "email",
    placeholder: "Enter your email",
    required: true,
  },
  {
    label: "Password",
    name: "password",
    type: "password",
    placeholder: "Enter your password",
    required: true,
  },
];

export const userRegisterFields = [
  {
    label: "Full Name",
    name: "fullname",
    type: "text",
    placeholder: "Enter your full name",
    required: true,
  },
  {
    label: "Email",
    name: "email",
    type: "email",
    placeholder: "Enter your email",
    required: true,
  },
  {
    label: "Password",
    name: "password",
    type: "password",
    placeholder: "Create a password",
    required: true,
  },
  {
    label: "Confirm Password",
    name: "confirmPassword",
    type: "password",
    placeholder: "Re-enter your password",
    required: true,
  },
];

// recruiterFields.js

export const recruiterLoginFields = [
  {
    label: "Email",
    name: "email",
    type: "email",
    placeholder: "Enter your work email",
    required: true,
  },
  {
    label: "Password",
    name: "password",
    type: "password",
    placeholder: "Enter your password",
    required: true,
  },
];

export const recruiterSignupFields = [
  {
    label: "Full Name",
    name: "name",
    type: "text",
    placeholder: "Enter your full name",
    required: true,
  },
  {
    label: "Company Name",
    name: "company",
    type: "text",
    placeholder: "Munch",
    required: true,
  },
  {
    label: "Designation",
    name: "designation",
    type: "text",
    placeholder: "Ex- HR,TL,Assistant Manager",
    required: true,
  },
  {
    label: "Phone Number",
    name: "phone",
    type: "number",
    placeholder: "9810012345",
  },
  {
    label: "Work Email",
    name: "email",
    type: "email",
    placeholder: "john@munchin.com",
    required: true,
  },
  {
    label: "Password",
    name: "password",
    type: "password",
    placeholder: "Create a password",
    required: true,
  },
  {
    label: "Confirm Password",
    name: "confirmPassword",
    type: "password",
    placeholder: "Re-enter your password",
    required: true,
  },
];

// InputFields.js

// InputFields.js

export const recruiterProfileFields = [
  {
    label: "Company Name",
    name: "company",
    type: "text",
    placeholder: "Enter your company name",
    required: true,
  },
  {
    label: "LinkedIn URL",
    name: "linkedin",
    type: "text",
    placeholder: "Enter LinkedIn URL",
    required: true,
  },
  {
    label: "Company Website",
    name: "companyWebsite",
    type: "url",
    placeholder: "https://yourcompany.com",
    required: true,
  },
  {
    label: "Company Size",
    name: "companySize",
    type: "select",
    options: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
    placeholder: "Select company size",
    required: true,
  },
  {
    label: "Industry Type",
    name: "industryType",
    type: "select",
    options: [
      "Information Technology",
      "Finance",
      "Healthcare",
      "Education",
      "Retail",
      "Manufacturing",
      "Media",
      "Real Estate",
      "Telecommunications",
      "Other",
    ],
    placeholder: "Select industry type",
    required: true,
  },
  {
    label: "Company Type",
    name: "companyType",
    type: "select",
    options: [
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
    placeholder: "Select company type",
    required: true,
  },
  {
    label: "Company Tagline",
    name: "companyTagline",
    type: "text",
    placeholder: "Innovating the future",
    required: true,
  },
  {
    label: "Founded Year",
    name: "foundyear",
    type: "number",
    placeholder: "2025",
    required: true,
  },
  {
    label: "Twitter",
    name: "twitter",
    type: "url",
    placeholder: "https://twitter.com/yourcompany",
    required: true,
  },
  {
    label: "Headquarter Location",
    name: "headquarterLocation",
    type: "text",
    placeholder: "e.g. San Francisco, CA",
    required: true,
  },
  {
    label: "About Company",
    name: "aboutCompany",
    type: "textarea",
    placeholder: "Brief description of your company...",
    required: true,
  },
];
