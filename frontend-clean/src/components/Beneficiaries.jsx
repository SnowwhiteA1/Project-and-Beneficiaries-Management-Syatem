import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  CircularProgress,
  Chip,
  Snackbar,
  Alert,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useParams, useNavigate } from "react-router-dom";

const companyLogo = "/logo.jpeg";

const Beneficiaries = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [activeStep, setActiveStep] = useState(0);

  // Form data with all required fields
  const [formData, setFormData] = useState({
    // Personal Information
    learner_first_name: "",
    learner_surname: "",
    learner_initials: "",
    learner_title: "Mr",
    learner_id_number: "",
    learner_contact_number: "",
    learner_email: "",
    learner_parent_contact: "",
    learner_home_language: "",
    
    // Programme Information
    learning_programme_type: "",
    programme_start_date: "",
    programme_completion_date: "",
    certificate_issue_date: "",
    ofo_code: "",
    nqf_level: "",
    programme_description: "",
    programme_funding_type: "",
    
    // Employer Information
    employer_name: "",
    employer_sdl_number: "",
    employer_contact_details: "",
    
    // Training Provider Information
    training_provider_name: "",
    training_provider_sdl_number: "",
    training_provider_contact_details: "",
    training_provider_type: "",
    training_provider_province: "",
    training_provider_code: "",
    training_provider_etqa_id: "",
    training_provider_postal_address: "",
    training_provider_accreditation_start_date: "",
    training_provider_province_code: "",
    training_provider_physical_address: "",
    
    // Learner Location Information
    learner_province: "",
    learner_local_district: "",
    learner_residential_area: "",
    learner_area_type: "",
    learner_physical_address_code: "",
    learner_stats_area_code: "",
    
    // Financial Information
    amount_spent_per_learner: "",
    
    // Project Information
    project_number: "",
    activity_number: "",
    app_sub_programme: "",
    agreement_number: "",
    key_dev_transformation: "",
    
    // Educational Information
    learner_last_school_emis: "",
    learner_last_school_year: "",
    
    // NQF Intervention Information
    non_nqf_intervention_subfield_id: "",
    non_nqf_intervention_status_id: "",
    non_nqf_intervention_credit: "",
    unit_standard_id: "",
    
    // Additional Information
    additional_documents: "",
    project_enrolled: projectId,
    uploaded_file: null,
  });

  const steps = ['Personal Information', 'Programme Details', 'Employer & Training Provider', 'Additional Information'];

  const fieldGroups = {
    0: [ // Personal Information
      'learner_first_name', 'learner_surname', 'learner_initials', 'learner_title',
      'learner_id_number', 'learner_contact_number', 'learner_email', 'learner_parent_contact',
      'learner_home_language', 'learner_province', 'learner_local_district', 'learner_residential_area',
      'learner_area_type', 'learner_physical_address_code', 'learner_stats_area_code'
    ],
    1: [ // Programme Details
      'learning_programme_type', 'programme_start_date', 'programme_completion_date', 'certificate_issue_date',
      'ofo_code', 'nqf_level', 'programme_description', 'programme_funding_type', 'amount_spent_per_learner',
      'project_number', 'activity_number', 'app_sub_programme', 'agreement_number'
    ],
    2: [ // Employer & Training Provider
      'employer_name', 'employer_sdl_number', 'employer_contact_details',
      'training_provider_name', 'training_provider_sdl_number', 'training_provider_contact_details',
      'training_provider_type', 'training_provider_province', 'training_provider_code',
      'training_provider_etqa_id', 'training_provider_postal_address', 'training_provider_accreditation_start_date',
      'training_provider_province_code', 'training_provider_physical_address'
    ],
    3: [ // Additional Information
      'key_dev_transformation', 'learner_last_school_emis', 'learner_last_school_year',
      'non_nqf_intervention_subfield_id', 'non_nqf_intervention_status_id', 'non_nqf_intervention_credit',
      'unit_standard_id', 'additional_documents'
    ]
  };

  const fieldLabels = {
    learner_first_name: "First Name *",
    learner_surname: "Surname *",
    learner_initials: "Initials",
    learner_title: "Title *",
    learner_id_number: "ID Number *",
    learning_programme_type: "Programme Type *",
    programme_start_date: "Programme Start Date *",
    programme_completion_date: "Programme Completion Date",
    certificate_issue_date: "Certificate Issue Date",
    ofo_code: "OFO Code",
    nqf_level: "NQF Level",
    programme_description: "Programme Description *",
    employer_name: "Employer Name",
    employer_sdl_number: "Employer SDL Number",
    employer_contact_details: "Employer Contact Details",
    training_provider_name: "Training Provider Name *",
    training_provider_sdl_number: "Training Provider SDL Number",
    training_provider_contact_details: "Training Provider Contact Details",
    training_provider_type: "Training Provider Type",
    training_provider_province: "Training Provider Province",
    learner_province: "Learner Province",
    learner_local_district: "Learner Local District",
    learner_residential_area: "Learner Residential Area",
    learner_area_type: "Learner Area Type",
    learner_physical_address_code: "Physical Address Code",
    programme_funding_type: "Programme Funding Type",
    amount_spent_per_learner: "Amount Spent Per Learner",
    key_dev_transformation: "Key Development Transformation",
    project_number: "Project Number",
    activity_number: "Activity Number",
    app_sub_programme: "App Sub Programme",
    learner_contact_number: "Learner Contact Number *",
    learner_email: "Learner Email",
    learner_parent_contact: "Parent Contact",
    non_nqf_intervention_subfield_id: "Non-NQF Intervention Subfield ID",
    non_nqf_intervention_status_id: "Non-NQF Intervention Status ID",
    non_nqf_intervention_credit: "Non-NQF Intervention Credit",
    unit_standard_id: "Unit Standard ID",
    training_provider_code: "Training Provider Code",
    training_provider_etqa_id: "Training Provider ETQA ID",
    training_provider_postal_address: "Training Provider Postal Address",
    training_provider_accreditation_start_date: "Accreditation Start Date",
    training_provider_province_code: "Training Provider Province Code",
    training_provider_physical_address: "Training Provider Physical Address",
    learner_home_language: "Learner Home Language",
    agreement_number: "Agreement Number",
    learner_last_school_emis: "Last School EMIS",
    learner_last_school_year: "Last School Year",
    learner_stats_area_code: "Stats Area Code",
    additional_documents: "Additional Documents",
  };

  // Fetch beneficiaries
  useEffect(() => {
    fetchBeneficiaries();
  }, [projectId]);

  const fetchBeneficiaries = async () => {
    try {
      setLoading(true);
      // FIXED: Using the correct endpoint from your backend
      const res = await fetch(`http://127.0.0.1:5050/beneficiaries/${projectId}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setBeneficiaries(data);
    } catch (err) {
      console.error("Error fetching beneficiaries:", err);
      showSnackbar("Error loading beneficiaries", "error");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFormData({ ...formData, uploaded_file: e.target.files[0] });
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Add beneficiary - FIXED VERSION
  const handleAddBeneficiary = async () => {
    try {
      const formDataToSend = new FormData();
      
      // Append all form data including project_enrolled
      Object.keys(formData).forEach((key) => {
        if (key !== "uploaded_file") {
          formDataToSend.append(key, formData[key] || '');
        }
      });
      
      // Append file if exists - using 'file' as the backend expects
      if (formData.uploaded_file) {
        formDataToSend.append("file", formData.uploaded_file);
      }

      console.log("Submitting beneficiary data...");
      
      const res = await fetch("http://127.0.0.1:5050/beneficiaries", {
        method: "POST",
        body: formDataToSend, // Using FormData directly, no Content-Type header
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add beneficiary");

      showSnackbar("Beneficiary added successfully!");
      setOpenDialog(false);
      setActiveStep(0);
      
      // Reset form but keep project_enrolled
      const resetForm = {
        ...Object.fromEntries(
          Object.keys(formData).map(key => [key, key === 'project_enrolled' ? projectId : ''])
        ),
        learner_title: "Mr"
      };
      setFormData(resetForm);
      
      fetchBeneficiaries();
    } catch (err) {
      console.error("Error adding beneficiary:", err);
      showSnackbar(err.message, "error");
    }
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const isProgrammeActive = (startDate, endDate) => {
    if (!startDate) return false;
    const today = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    if (end && today > end) return false;
    return today >= start;
  };

  const getStepContent = (step) => {
    const fields = fieldGroups[step];
    return (
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {fields.map((field) => (
          <Grid item xs={12} sm={6} key={field}>
            {field === 'learner_title' ? (
              <FormControl fullWidth size="small">
                <InputLabel>Title</InputLabel>
                <Select
                  name={field}
                  value={formData[field]}
                  label="Title"
                  onChange={handleInputChange}
                >
                  <MenuItem value="Mr">Mr</MenuItem>
                  <MenuItem value="Ms">Ms</MenuItem>
                  <MenuItem value="Mrs">Mrs</MenuItem>
                  <MenuItem value="Dr">Dr</MenuItem>
                  <MenuItem value="Prof">Prof</MenuItem>
                </Select>
              </FormControl>
            ) : field === 'learner_area_type' ? (
              <FormControl fullWidth size="small">
                <InputLabel>Area Type</InputLabel>
                <Select
                  name={field}
                  value={formData[field]}
                  label="Area Type"
                  onChange={handleInputChange}
                >
                  <MenuItem value="Urban">Urban</MenuItem>
                  <MenuItem value="Rural">Rural</MenuItem>
                  <MenuItem value="Semi-Urban">Semi-Urban</MenuItem>
                </Select>
              </FormControl>
            ) : (
              <TextField
                label={fieldLabels[field] || field}
                name={field}
                value={formData[field]}
                onChange={handleInputChange}
                fullWidth
                size="small"
                type={field.includes("date") ? "date" : "text"}
                InputLabelProps={field.includes("date") ? { shrink: true } : {}}
                required={fieldLabels[field]?.includes('*')}
              />
            )}
          </Grid>
        ))}
        
        {step === 3 && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Upload Supporting Documents
            </Typography>
            <input 
              type="file" 
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
              Accepted formats: PDF, Word, JPEG, PNG
            </Typography>
          </Grid>
        )}
      </Grid>
    );
  };

  if (loading) {
    return (
      <Box p={4} display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "black", mb: 1 }}>
          JumpStart Your Career (NPO)
        </Typography>
        <Avatar alt="Company Logo" src={companyLogo} sx={{ width: 100, height: 80 }} />
      </Box>

      <Divider sx={{ borderBottomWidth: 2, bgcolor: "black", mb: 3 }} />

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Beneficiaries for Project #{projectId}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Total Beneficiaries: <strong>{beneficiaries.length}</strong>
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ minWidth: 160 }}
        >
          Add Beneficiary
        </Button>
      </Box>

      {beneficiaries.length === 0 ? (
        <Box textAlign="center" mt={4} p={4}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No beneficiaries found for this project.
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Click "Add Beneficiary" to get started.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {beneficiaries.map((b) => {
            const isActive = isProgrammeActive(b.programme_start_date, b.programme_completion_date);
            return (
              <Grid item xs={12} sm={6} md={4} key={b.id}>
                <Card
                  sx={{
                    borderRadius: "12px",
                    boxShadow: 3,
                    p: 2,
                    border: isActive ? "2px solid #4CAF50" : "2px solid transparent",
                    transition: "all 0.3s ease",
                    "&:hover": { boxShadow: 6, transform: "translateY(-2px)" },
                  }}
                >
                  <CardContent sx={{ pt: 1 }}>
                    <Typography variant="h6" gutterBottom sx={{ pr: 4 }}>
                      {b.learner_first_name} {b.learner_surname}
                      {b.learner_initials && ` (${b.learner_initials})`}
                    </Typography>

                    <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Chip
                        label={b.learning_programme_type || "No Programme"}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      {b.nqf_level && <Chip label={`NQF ${b.nqf_level}`} size="small" variant="outlined" />}
                      {isActive && <Chip label="Active" size="small" color="success" />}
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {b.learner_id_number && (
                        <Typography variant="body2">
                          <strong>ID:</strong> {b.learner_id_number}
                        </Typography>
                      )}
                      {b.employer_name && (
                        <Typography variant="body2">
                          <strong>Employer:</strong> {b.employer_name}
                        </Typography>
                      )}
                      {b.training_provider_name && (
                        <Typography variant="body2">
                          <strong>Provider:</strong> {b.training_provider_name}
                        </Typography>
                      )}
                      {b.programme_description && (
                        <Typography variant="body2">
                          <strong>Qualification:</strong> {b.programme_description}
                        </Typography>
                      )}
                      {b.learner_email && (
                        <Typography variant="body2">
                          <strong>Email:</strong> {b.learner_email}
                        </Typography>
                      )}
                      {b.learner_contact_number && (
                        <Typography variant="body2">
                          <strong>Contact:</strong> {b.learner_contact_number}
                        </Typography>
                      )}
                      <Typography variant="body2">
                        <strong>Duration:</strong> {formatDisplayDate(b.programme_start_date)} →{" "}
                        {formatDisplayDate(b.programme_completion_date)}
                      </Typography>
                      {b.uploaded_file && (
                        <Typography variant="body2">
                          <strong>File:</strong>{" "}
                          <a
                            href={`http://127.0.0.1:5050/uploads/${b.uploaded_file}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View Document
                          </a>
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Add Beneficiary Dialog - FIXED HYDRATION ERROR */}
      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setActiveStep(0); }} fullWidth maxWidth="lg">
        <DialogTitle>
          <Box>
            <Typography variant="h6" component="div">
              Add New Beneficiary
            </Typography>
            <Stepper activeStep={activeStep} sx={{ mt: 2 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ minHeight: '400px' }}>
          {getStepContent(activeStep)}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
          <Button 
            onClick={handleBack} 
            disabled={activeStep === 0}
          >
            Back
          </Button>
          <Box>
            <Button onClick={() => { setOpenDialog(false); setActiveStep(0); }} sx={{ mr: 1 }}>
              Cancel
            </Button>
            {activeStep === steps.length - 1 ? (
              <Button variant="contained" onClick={handleAddBeneficiary}>
                Save Beneficiary
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box mt={3}>
        <Button onClick={() => navigate(-1)} variant="outlined">
          Back to Projects
        </Button>
      </Box>
    </Box>
  );
};

export default Beneficiaries;