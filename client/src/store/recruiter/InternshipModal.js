import { create } from 'zustand';

const useInternshipFormStore = create((set) => ({
  // Modal state
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),

  // Form state (aligned with your JobModel)
  InternForm: {
    title: '',
    location: 'Remote', // enum: Remote, Hybrid, On-Site
    jobType: 'Full-time', // enum: Full-time, Part-time, etc.
    domain: '',
    role: '',
    requiredSkills: [], // array of strings
    optionalSkills:[],
    experience:"",
    description: '',
    salaryRange: {
      min: '',
      max: '',
    },
    benchmarkScore:"",
    nop:"",
    experience:""
  },

  // Update top-level field
  setField: (field, value) =>
    set((state) => ({
      InternForm: {
        ...state.InternForm,
        [field]: value,
      },
    })),

  // Update nested salaryRange field
  setSalaryField: (key, value) =>
    set((state) => ({
      InternForm: {
        ...state.InternForm,
        salaryRange: {
          ...state.InternForm.salaryRange,
          [key]: value,
        },
      },
    })),

  // Set skills
  setSkills: (skills) =>
    set((state) => ({
      InternForm: {
        ...state.InternForm,
        requiredSkills: skills,
      },
    })),

    setOptionalSkills:(skills)=>{
    set((state)=>({
      InternForm:{
        ...state.InternForm,
        optionalSkills:skills
      }
    }))
    },

  // Reset form
  resetForm: () =>
    set(() => ({
      InternForm: {
        title: '',
        company: '',
        location: 'Remote',
        jobType: 'Full-time',
        domain: '',
        role: '',
        requiredSkills: [],
        description: '',
        salaryRange: {
          min: '',
          max: '',
        },
        createdBy: '',
      },
    })),
}));

export default useInternshipFormStore;
