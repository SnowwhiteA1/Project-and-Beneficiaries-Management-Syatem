import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  Paper,
  Avatar,
  Stack,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
  Chip,
  Tabs,
  Tab,
  Divider
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import HomeIcon from "@mui/icons-material/Home";
import WorkIcon from "@mui/icons-material/Work";
import SchoolIcon from "@mui/icons-material/School";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = "http://localhost:5050";

const Beneficiaries = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectTitle, setProjectTitle] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Initialize form with ALL required fields from database
  const initialFormData = {
    // Personal Information (Required by backend)
    first_name: "",
    last_name: "",
    learner_surname: "", // Database field name
    learner_names: "",   // Database field name
    initials: "",
    id_number: "",
    date_of_birth: "",
    gender: "",
    race: "",
    age: "",
    home_language: "English",
    
    // Contact Information
    mobile_phone: "",
    email_address: "",
    parent_guardian_mobile: "",
    parent_guardian_email: "",
    
    // Demographic Information (with defaults from database)
    youth: true,           // Default in DB: true
    disability: false,     // Default in DB: false
    disability_type: "",
    non_rsa_citizen: false, // Default in DB: false
    
    // Address Information
    learner_province: "",
    learner_district_municipality: "",
    learner_local_municipality: "",
    residential_area: "",
    area_type: "",
    
    // Programme Information (Required by backend)
    type_of_learning_programme: "Training",
    programme_start_date: new Date().toISOString().split('T')[0],
    programme_completion_date: "",
    certificate_issue_date: "",
    programme_outcome: "",
    status: "Active", // Default in DB: 'Active'
    
    // Qualification Information
    ofo_code: "",
    nqf_level: "",
    qualification_id: "",
    programme_description: "",
    learnership_id: "",
    unit_standard_id: "",
    
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
    training_provider_physical_address: "",
    
    // Financial Information
    seta_industry_funded: false,
    amount_spent_per_learner: "0",
    
    // Additional Fields
    agreement_moa_number: "",
    project_number: "",
    activity_number: "",
    app_sub_programme: "",
    
    // School Information
    last_school_emis: "",
    last_school_year: "",
    
    // Non-NQF Fields
    non_nqf_intervention_subfield: "",
    non_nqf_intervention_status: "",
    non_nqf_intervention_credit: "",
    
    // Employment Information
    employment_status: "",
    current_employer: "",
    monthly_income: "0",
    skills: "",
    
    // Validation Fields (with defaults from database)
    valid_id_number_length: true,      // Default in DB: true
    valid_age_for_youth: true,         // Default in DB: true
    correctly_reported_youth: true,    // Default in DB: true
    correctly_reported_gender: true,   // Default in DB: true
    correctly_reported_race: true,     // Default in DB: true
    
    // Notes
    notes: "",
    validation_errors: "",
    beneficiary_status: "Current"      // Default in DB: 'Current'
  };

  const [formData, setFormData] = useState({ ...initialFormData });

  useEffect(() => {
    fetchProjectAndBeneficiaries();
  }, [projectId]);

  const fetchProjectAndBeneficiaries = async () => {
    try {
      setLoading(true);
      
      // Fetch project details
      const projectRes = await axios.get(`${API_BASE}/api/projects/${projectId}`);
      if (projectRes.data) {
        setProjectTitle(projectRes.data.name || `Project #${projectId}`);
      }
      
      // Fetch beneficiaries for this project
      const beneficiariesRes = await axios.get(
        `${API_BASE}/api/projects/${projectId}/beneficiaries`
      );
      setBeneficiaries(beneficiariesRes.data);
      
    } catch (err) {
      console.error("Error fetching data:", err);
      showSnackbar("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({ ...initialFormData });
    setSelectedBeneficiary(null);
    setIsEdit(false);
    setActiveTab(0);
  };

  const handleAddBeneficiary = async () => {
    try {
      // Validate required fields
      if (!formData.first_name.trim()) {
        showSnackbar("First name is required", "error");
        return;
      }
      if (!formData.last_name.trim()) {
        showSnackbar("Last name is required", "error");
        return;
      }
      if (!formData.id_number.trim()) {
        showSnackbar("ID number is required", "error");
        return;
      }

      // Prepare COMPLETE data for backend - mapping frontend to backend field names
      const dataToSend = {
        // Map frontend field names to backend/database field names
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        learner_names: formData.first_name.trim(),      // Database field
        learner_surname: formData.last_name.trim(),     // Database field
        learner_initials: formData.initials || "",
        id_number: formData.id_number.trim(),
        
        // Personal details
        gender: formData.gender || "",
        age: formData.age ? parseInt(formData.age) : null,
        race: formData.race || "",
        date_of_birth: formData.date_of_birth || null,
        home_language: formData.home_language || "English",
        
        // Contact information
        mobile_phone: formData.mobile_phone || "",
        email: formData.email_address || "",
        parent_guardian_mobile: formData.parent_guardian_mobile || "",
        parent_guardian_email: formData.parent_guardian_email || "",
        
        // Demographic info
        disability: Boolean(formData.disability),
        disability_type: formData.disability_type || "",
        youth: Boolean(formData.youth),
        non_rsa_citizen: Boolean(formData.non_rsa_citizen),
        
        // Address info
        learner_province: formData.learner_province || "",
        learner_district_municipality: formData.learner_district_municipality || "",
        learner_local_municipality: formData.learner_local_municipality || "",
        residential_area: formData.residential_area || "",
        area_type: formData.area_type || "",
        
        // Programme info - REQUIRED by database
        learning_programme_type: formData.type_of_learning_programme || "Training",
        programme_start_date: formData.programme_start_date || new Date().toISOString().split('T')[0],
        programme_completion_date: formData.programme_completion_date || null,
        certificate_issue_date: formData.certificate_issue_date || null,
        programme_outcome: formData.programme_outcome || "",
        status: formData.status || "Active",
        
        // Qualification info
        ofo_code: formData.ofo_code || "",
        nqf_level: formData.nqf_level || "",
        qualification_id: formData.qualification_id || "",
        qualification_description: formData.programme_description || "",
        learnership_id: formData.learnership_id || "",
        unit_standard_id: formData.unit_standard_id || "",
        
        // Employer info
        employer_name: formData.employer_name || "",
        employer_sdl_number: formData.employer_sdl_number || "",
        employer_contact_details: formData.employer_contact_details || "",
        
        // Training provider info
        training_provider_name: formData.training_provider_name || "",
        training_provider_sdl_number: formData.training_provider_sdl_number || "",
        training_provider_contact_details: formData.training_provider_contact_details || "",
        training_provider_type: formData.training_provider_type || "",
        training_provider_province: formData.training_provider_province || "",
        training_provider_code: formData.training_provider_code || "",
        training_provider_etqa_id: formData.training_provider_etqa_id || "",
        training_provider_postal_address: formData.training_provider_postal_address || "",
        training_provider_physical_address: formData.training_provider_physical_address || "",
        
        // Financial info
        seta_funded: Boolean(formData.seta_industry_funded),
        amount_spent_per_learner: formData.amount_spent_per_learner ? parseFloat(formData.amount_spent_per_learner) : 0,
        
        // Additional fields
        agreement_number: formData.agreement_moa_number || "",
        project_number: formData.project_number || "",
        activity_number: formData.activity_number || "",
        app_sub_programme: formData.app_sub_programme || "",
        
        // School info
        last_school_emis: formData.last_school_emis || "",
        last_school_year: formData.last_school_year || "",
        
        // Non-NQF fields
        non_nqf_subfield_id: formData.non_nqf_intervention_subfield || "",
        non_nqf_status_id: formData.non_nqf_intervention_status || "",
        non_nqf_credit: formData.non_nqf_intervention_credit || "",
        
        // Employment info
        employment_status: formData.employment_status || "",
        current_employer: formData.current_employer || "",
        monthly_income: formData.monthly_income ? parseFloat(formData.monthly_income) : 0,
        skills: formData.skills || "",
        
        // Validation fields
        valid_id_number_length: Boolean(formData.valid_id_number_length),
        valid_age_for_youth: Boolean(formData.valid_age_for_youth),
        correctly_reported_youth: Boolean(formData.correctly_reported_youth),
        correctly_reported_gender: Boolean(formData.correctly_reported_gender),
        correctly_reported_race: Boolean(formData.correctly_reported_race),
        
        // Notes
        notes: formData.notes || "",
        validation_errors: formData.validation_errors || "",
        beneficiary_status: formData.beneficiary_status || "Current"
      };

      console.log("Sending COMPLETE data to backend:", JSON.stringify(dataToSend, null, 2));

      const response = await axios.post(
        `${API_BASE}/api/projects/${projectId}/beneficiaries`,
        dataToSend,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log("Beneficiary added successfully:", response.data);
      showSnackbar("Beneficiary added successfully!");
      setOpenDialog(false);
      resetForm();
      fetchProjectAndBeneficiaries();
    } catch (err) {
      console.error("❌ ERROR adding beneficiary:", err);
      console.error("❌ Error response data:", err.response?.data);
      console.error("❌ Error status:", err.response?.status);
      
      let errorMessage = "Failed to add beneficiary. ";
      
      if (err.response?.data?.error) {
        errorMessage += `Server error: ${JSON.stringify(err.response.data.error)}`;
      } else if (err.response?.status === 500) {
        errorMessage += "Internal server error. Check backend logs for details.";
      } else if (err.message) {
        errorMessage += `Error: ${err.message}`;
      }
      
      showSnackbar(errorMessage, "error");
    }
  };

  const handleUpdateBeneficiary = async () => {
    try {
      if (!selectedBeneficiary) return;

      // Validate required fields
      if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.id_number.trim()) {
        showSnackbar("First name, last name, and ID number are required", "error");
        return;
      }

      const updateData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        id_number: formData.id_number.trim(),
        gender: formData.gender || "",
        age: formData.age ? parseInt(formData.age) : null,
        race: formData.race || "",
        mobile_phone: formData.mobile_phone || "",
        email: formData.email_address || "",
        residential_area: formData.residential_area || "",
        learner_province: formData.learner_province || "",
        learner_municipality: formData.learner_district_municipality || "",
        disability: Boolean(formData.disability),
        youth: Boolean(formData.youth),
        non_rsa_citizen: Boolean(formData.non_rsa_citizen)
      };

      const response = await axios.put(
        `${API_BASE}/api/beneficiaries/${selectedBeneficiary.id}`,
        updateData
      );

      showSnackbar("Beneficiary updated successfully!");
      setOpenDialog(false);
      resetForm();
      fetchProjectAndBeneficiaries();
    } catch (err) {
      console.error("Error updating beneficiary:", err);
      showSnackbar(
        err.response?.data?.error || "Failed to update beneficiary",
        "error"
      );
    }
  };

  const handleDeleteBeneficiary = async () => {
    try {
      if (!selectedBeneficiary) return;

      await axios.delete(
        `${API_BASE}/api/beneficiaries/${selectedBeneficiary.id}`
      );

      showSnackbar("Beneficiary deleted successfully!");
      setMenuAnchorEl(null);
      fetchProjectAndBeneficiaries();
    } catch (err) {
      console.error("Error deleting beneficiary:", err);
      showSnackbar(
        err.response?.data?.error || "Failed to delete beneficiary",
        "error"
      );
    }
  };

  const handleMenuOpen = (event, beneficiary) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedBeneficiary(beneficiary);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleEditClick = () => {
    if (!selectedBeneficiary) return;

    // For editing, populate the form with existing data
    setFormData(prev => ({
      ...prev,
      first_name: selectedBeneficiary.first_name || "",
      last_name: selectedBeneficiary.last_name || "",
      id_number: selectedBeneficiary.id_number || "",
      gender: selectedBeneficiary.gender || "",
      age: selectedBeneficiary.age || "",
      race: selectedBeneficiary.race || "",
      mobile_phone: selectedBeneficiary.mobile_phone || "",
      email_address: selectedBeneficiary.email || "",
      residential_area: selectedBeneficiary.residential_area || "",
      learner_province: selectedBeneficiary.learner_province || "",
      learner_district_municipality: selectedBeneficiary.learner_municipality || "",
      disability: selectedBeneficiary.disability || false,
      youth: selectedBeneficiary.youth || false,
      non_rsa_citizen: selectedBeneficiary.non_rsa_citizen || false,
    }));
    
    setIsEdit(true);
    setOpenDialog(true);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedBeneficiary.first_name} ${selectedBeneficiary.last_name}?`)) {
      handleDeleteBeneficiary();
    }
    handleMenuClose();
  };

  const handleViewClick = (beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setOpenViewDialog(true);
  };

  const handleSave = () => {
    if (isEdit) {
      handleUpdateBeneficiary();
    } else {
      handleAddBeneficiary();
    }
  };

  // Tab panel component
  const TabPanel = ({ children, value, index }) => {
    return (
      <div hidden={value !== index}>
        {value === index && (
          <Box sx={{ p: 3 }}>
            {children}
          </Box>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
      {/* HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/dashboard")}
            sx={{ mb: 1 }}
            variant="outlined"
          >
            Back to Projects
          </Button>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Beneficiaries Management
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="subtitle1" color="text.secondary">
              Project: <strong>{projectTitle}</strong>
            </Typography>
            <Box sx={{ 
              bgcolor: 'primary.main', 
              color: 'white', 
              px: 2, 
              py: 0.5, 
              borderRadius: 2,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1
            }}>
              <PersonIcon fontSize="small" />
              <Typography variant="body2" fontWeight="bold">
                {beneficiaries.length} Beneficiary{beneficiaries.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Button
          variant="contained"
          color="warning"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm();
            setOpenDialog(true);
          }}
          size="large"
        >
          Add New Beneficiary
        </Button>
      </Box>

      {/* BENEFICIARIES GRID */}
      {beneficiaries.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center", mt: 4, borderRadius: 3 }}>
          <PersonIcon sx={{ fontSize: 80, color: "text.secondary", mb: 3, opacity: 0.7 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom fontWeight="medium">
            No beneficiaries found for this project
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
            Start by adding beneficiaries to track their progress and information.
          </Typography>
          <Button
            variant="contained"
            color="warning"
            startIcon={<AddIcon />}
            onClick={() => {
              resetForm();
              setOpenDialog(true);
            }}
            size="large"
          >
            Add First Beneficiary
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {beneficiaries.map((beneficiary) => (
            <Grid item xs={12} sm={6} md={4} key={beneficiary.id}>
              <Card 
                sx={{ 
                  height: "100%", 
                  position: "relative", 
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': { 
                    boxShadow: 6,
                    transform: 'translateY(-4px)'
                  }
                }}
                onClick={() => handleViewClick(beneficiary)}
              >
                <IconButton
                  sx={{ 
                    position: "absolute", 
                    right: 8, 
                    top: 8, 
                    zIndex: 1,
                    bgcolor: 'background.paper',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuOpen(e, beneficiary);
                  }}
                >
                  <MoreVertIcon />
                </IconButton>

                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: "primary.main", 
                        mr: 2, 
                        width: 56, 
                        height: 56,
                        fontSize: '1.5rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {beneficiary.first_name?.charAt(0)?.toUpperCase() || "B"}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" noWrap>
                        {beneficiary.first_name} {beneficiary.last_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ID: {beneficiary.id_number || "N/A"}
                      </Typography>
                    </Box>
                  </Box>

                  <Stack spacing={1.5} sx={{ mt: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <PersonIcon sx={{ mr: 1.5, fontSize: 20, color: "primary.main" }} />
                      <Typography variant="body2">
                        {beneficiary.gender || "Not specified"} • {beneficiary.age || "N/A"} years
                      </Typography>
                    </Box>
                    
                    {beneficiary.mobile_phone && (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <PhoneIcon sx={{ mr: 1.5, fontSize: 20, color: "primary.main" }} />
                        <Typography variant="body2">
                          {beneficiary.mobile_phone}
                        </Typography>
                      </Box>
                    )}
                    
                    {beneficiary.email && (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <EmailIcon sx={{ mr: 1.5, fontSize: 20, color: "primary.main" }} />
                        <Typography variant="body2" noWrap>
                          {beneficiary.email}
                        </Typography>
                      </Box>
                    )}
                    
                    {beneficiary.residential_area && (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <HomeIcon sx={{ mr: 1.5, fontSize: 20, color: "primary.main" }} />
                        <Typography variant="body2" sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {beneficiary.residential_area}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                  
                  <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {beneficiary.disability && (
                      <Chip 
                        label="Disability" 
                        size="small" 
                        color="secondary" 
                        variant="outlined"
                      />
                    )}
                    {beneficiary.youth && (
                      <Chip 
                        label="Youth" 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    )}
                    {beneficiary.non_rsa_citizen && (
                      <Chip 
                        label="Non-RSA" 
                        size="small" 
                        color="warning" 
                        variant="outlined"
                      />
                    )}
                  </Box>
                  
                  {beneficiary.created_at && (
                    <Typography 
                      variant="caption" 
                      color="text.secondary" 
                      sx={{ 
                        display: "block", 
                        mt: 3, 
                        pt: 2, 
                        borderTop: 1, 
                        borderColor: 'divider' 
                      }}
                    >
                      Added: {new Date(beneficiary.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ADD/EDIT DIALOG WITH ALL REQUIRED FIELDS */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        fullWidth 
        maxWidth="lg"
        scroll="paper"
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
          <Box>
            <Typography variant="h6" component="div" fontWeight="bold">
              {isEdit ? "Edit Beneficiary" : "Add New Beneficiary"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Project: {projectTitle}
            </Typography>
          </Box>
        </DialogTitle>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            aria-label="beneficiary form tabs"
          >
            <Tab label="Basic Info" />
            <Tab label="Programme Details" />
            <Tab label="Employment & Training" />
            <Tab label="Additional Info" />
          </Tabs>
        </Box>
        
        <DialogContent dividers sx={{ p: 0 }}>
          {/* TAB 1: Basic Information */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name *"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  fullWidth
                  required
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name *"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  fullWidth
                  required
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="ID Number *"
                  value={formData.id_number}
                  onChange={(e) => handleInputChange("id_number", e.target.value)}
                  fullWidth
                  required
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Gender *</InputLabel>
                  <Select
                    value={formData.gender}
                    onChange={(e) => handleInputChange("gender", e.target.value)}
                    label="Gender *"
                    variant="outlined"
                  >
                    <MenuItem value=""><em>Select Gender</em></MenuItem>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Race</InputLabel>
                  <Select
                    value={formData.race}
                    onChange={(e) => handleInputChange("race", e.target.value)}
                    label="Race"
                    variant="outlined"
                  >
                    <MenuItem value=""><em>Select Race</em></MenuItem>
                    <MenuItem value="African">African</MenuItem>
                    <MenuItem value="Coloured">Coloured</MenuItem>
                    <MenuItem value="Indian">Indian</MenuItem>
                    <MenuItem value="White">White</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Mobile Phone"
                  value={formData.mobile_phone}
                  onChange={(e) => handleInputChange("mobile_phone", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  type="email"
                  value={formData.email_address}
                  onChange={(e) => handleInputChange("email_address", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Home Language</InputLabel>
                  <Select
                    value={formData.home_language}
                    onChange={(e) => handleInputChange("home_language", e.target.value)}
                    label="Home Language"
                    variant="outlined"
                  >
                    <MenuItem value="English">English</MenuItem>
                    <MenuItem value="Afrikaans">Afrikaans</MenuItem>
                    <MenuItem value="isiZulu">isiZulu</MenuItem>
                    <MenuItem value="isiXhosa">isiXhosa</MenuItem>
                    <MenuItem value="Sesotho">Sesotho</MenuItem>
                    <MenuItem value="Setswana">Setswana</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Date of Birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Initials"
                  value={formData.initials}
                  onChange={(e) => handleInputChange("initials", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                  Demographic Information
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.youth}
                      onChange={(e) => handleInputChange("youth", e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Youth (18-35 years)"
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.disability}
                      onChange={(e) => handleInputChange("disability", e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Person with Disability"
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.non_rsa_citizen}
                      onChange={(e) => handleInputChange("non_rsa_citizen", e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Non-RSA Citizen"
                />
              </Grid>
              
              {formData.disability && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Disability Type"
                    value={formData.disability_type}
                    onChange={(e) => handleInputChange("disability_type", e.target.value)}
                    fullWidth
                    size="small"
                    variant="outlined"
                  />
                </Grid>
              )}
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                  Address Information
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Province"
                  value={formData.learner_province}
                  onChange={(e) => handleInputChange("learner_province", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="District Municipality"
                  value={formData.learner_district_municipality}
                  onChange={(e) => handleInputChange("learner_district_municipality", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Local Municipality"
                  value={formData.learner_local_municipality}
                  onChange={(e) => handleInputChange("learner_local_municipality", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Area Type</InputLabel>
                  <Select
                    value={formData.area_type}
                    onChange={(e) => handleInputChange("area_type", e.target.value)}
                    label="Area Type"
                    variant="outlined"
                  >
                    <MenuItem value=""><em>Select Area Type</em></MenuItem>
                    <MenuItem value="Urban">Urban</MenuItem>
                    <MenuItem value="Rural">Rural</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Residential Area"
                  value={formData.residential_area}
                  onChange={(e) => handleInputChange("residential_area", e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* TAB 2: Programme Details */}
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                  Programme Information
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Programme Type</InputLabel>
                  <Select
                    value={formData.type_of_learning_programme}
                    onChange={(e) => handleInputChange("type_of_learning_programme", e.target.value)}
                    label="Programme Type"
                    variant="outlined"
                  >
                    <MenuItem value="Training">Training</MenuItem>
                    <MenuItem value="Workshop">Workshop</MenuItem>
                    <MenuItem value="Course">Course</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleInputChange("status", e.target.value)}
                    label="Status"
                    variant="outlined"
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                    <MenuItem value="Graduated">Graduated</MenuItem>
                    <MenuItem value="Dropped">Dropped</MenuItem>
                    <MenuItem value="Transferred">Transferred</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Programme Start Date"
                  type="date"
                  value={formData.programme_start_date}
                  onChange={(e) => handleInputChange("programme_start_date", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Programme Completion Date"
                  type="date"
                  value={formData.programme_completion_date}
                  onChange={(e) => handleInputChange("programme_completion_date", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Certificate Issue Date"
                  type="date"
                  value={formData.certificate_issue_date}
                  onChange={(e) => handleInputChange("certificate_issue_date", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Programme Outcome</InputLabel>
                  <Select
                    value={formData.programme_outcome}
                    onChange={(e) => handleInputChange("programme_outcome", e.target.value)}
                    label="Programme Outcome"
                    variant="outlined"
                  >
                    <MenuItem value=""><em>Select Outcome</em></MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Certified">Certified</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Divider sx={{ my: 2, width: '100%' }} />
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                  Qualification Information
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="OFO Code"
                  value={formData.ofo_code}
                  onChange={(e) => handleInputChange("ofo_code", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="NQF Level"
                  value={formData.nqf_level}
                  onChange={(e) => handleInputChange("nqf_level", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Qualification ID"
                  value={formData.qualification_id}
                  onChange={(e) => handleInputChange("qualification_id", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Learnership ID"
                  value={formData.learnership_id}
                  onChange={(e) => handleInputChange("learnership_id", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Programme Description"
                  value={formData.programme_description}
                  onChange={(e) => handleInputChange("programme_description", e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* TAB 3: Employment & Training */}
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                  Employment Information
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Employment Status</InputLabel>
                  <Select
                    value={formData.employment_status}
                    onChange={(e) => handleInputChange("employment_status", e.target.value)}
                    label="Employment Status"
                    variant="outlined"
                  >
                    <MenuItem value=""><em>Select Status</em></MenuItem>
                    <MenuItem value="Employed">Employed</MenuItem>
                    <MenuItem value="Unemployed">Unemployed</MenuItem>
                    <MenuItem value="Self-Employed">Self-Employed</MenuItem>
                    <MenuItem value="Student">Student</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Current Employer"
                  value={formData.current_employer}
                  onChange={(e) => handleInputChange("current_employer", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Employer Name"
                  value={formData.employer_name}
                  onChange={(e) => handleInputChange("employer_name", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Employer SDL Number"
                  value={formData.employer_sdl_number}
                  onChange={(e) => handleInputChange("employer_sdl_number", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Employer Contact Details"
                  value={formData.employer_contact_details}
                  onChange={(e) => handleInputChange("employer_contact_details", e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Divider sx={{ my: 2, width: '100%' }} />
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                  Training Provider Information
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Training Provider Name"
                  value={formData.training_provider_name}
                  onChange={(e) => handleInputChange("training_provider_name", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Training Provider SDL Number"
                  value={formData.training_provider_sdl_number}
                  onChange={(e) => handleInputChange("training_provider_sdl_number", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Provider Type</InputLabel>
                  <Select
                    value={formData.training_provider_type}
                    onChange={(e) => handleInputChange("training_provider_type", e.target.value)}
                    label="Provider Type"
                    variant="outlined"
                  >
                    <MenuItem value=""><em>Select Type</em></MenuItem>
                    <MenuItem value="Private">Private</MenuItem>
                    <MenuItem value="Public">Public</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Training Provider Province"
                  value={formData.training_provider_province}
                  onChange={(e) => handleInputChange("training_provider_province", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Training Provider Contact Details"
                  value={formData.training_provider_contact_details}
                  onChange={(e) => handleInputChange("training_provider_contact_details", e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Training Provider Postal Address"
                  value={formData.training_provider_postal_address}
                  onChange={(e) => handleInputChange("training_provider_postal_address", e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* TAB 4: Additional Info */}
          <TabPanel value={activeTab} index={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.seta_industry_funded}
                      onChange={(e) => handleInputChange("seta_industry_funded", e.target.checked)}
                      color="primary"
                    />
                  }
                  label="SETA Industry Funded"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Amount Spent per Learner"
                  type="number"
                  value={formData.amount_spent_per_learner}
                  onChange={(e) => handleInputChange("amount_spent_per_learner", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>R</Typography>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Monthly Income"
                  type="number"
                  value={formData.monthly_income}
                  onChange={(e) => handleInputChange("monthly_income", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>R</Typography>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Agreement/MOA Number"
                  value={formData.agreement_moa_number}
                  onChange={(e) => handleInputChange("agreement_moa_number", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Project Number"
                  value={formData.project_number}
                  onChange={(e) => handleInputChange("project_number", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Activity Number"
                  value={formData.activity_number}
                  onChange={(e) => handleInputChange("activity_number", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Skills"
                  value={formData.skills}
                  onChange={(e) => handleInputChange("skills", e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  variant="outlined"
                  placeholder="List skills separated by commas"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  fullWidth
                  multiline
                  rows={4}
                  size="small"
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </TabPanel>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Cancel
          </Button>
          <Box sx={{ flexGrow: 1 }}>
            {activeTab > 0 && (
              <Button 
                onClick={() => setActiveTab(activeTab - 1)}
                color="inherit"
              >
                Previous
              </Button>
            )}
          </Box>
          {activeTab < 3 ? (
            <Button 
              onClick={() => setActiveTab(activeTab + 1)}
              variant="outlined"
            >
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleSave} 
              variant="contained" 
              color="warning"
              disabled={!formData.first_name.trim() || !formData.last_name.trim() || !formData.id_number.trim()}
            >
              {isEdit ? "Update" : "Save"} Beneficiary
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* VIEW BENEFICIARY DETAILS DIALOG */}
      <Dialog 
        open={openViewDialog} 
        onClose={() => setOpenViewDialog(false)} 
        fullWidth 
        maxWidth="md"
        PaperProps={{
          sx: { maxHeight: '80vh' }
        }}
      >
        {selectedBeneficiary && (
          <>
            <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {selectedBeneficiary.first_name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" component="div" fontWeight="bold">
                    {selectedBeneficiary.first_name} {selectedBeneficiary.last_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ID: {selectedBeneficiary.id_number}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Personal Information
                  </Typography>
                  <Box sx={{ pl: 1 }}>
                    <Typography variant="body2">
                      <strong>Gender:</strong> {selectedBeneficiary.gender || "Not specified"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Age:</strong> {selectedBeneficiary.age || "N/A"} years
                    </Typography>
                    <Typography variant="body2">
                      <strong>Race:</strong> {selectedBeneficiary.race || "Not specified"}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Contact Information
                  </Typography>
                  <Box sx={{ pl: 1 }}>
                    <Typography variant="body2">
                      <strong>Phone:</strong> {selectedBeneficiary.mobile_phone || "Not specified"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Email:</strong> {selectedBeneficiary.email || "Not specified"}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Address Information
                  </Typography>
                  <Box sx={{ pl: 1 }}>
                    <Typography variant="body2">
                      <strong>Residential Area:</strong> {selectedBeneficiary.residential_area || "Not specified"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Province:</strong> {selectedBeneficiary.learner_province || "Not specified"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Municipality:</strong> {selectedBeneficiary.learner_municipality || "Not specified"}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Demographic Information
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                    {selectedBeneficiary.youth && (
                      <Chip label="Youth" color="primary" size="small" />
                    )}
                    {selectedBeneficiary.disability && (
                      <Chip label="Person with Disability" color="secondary" size="small" />
                    )}
                    {selectedBeneficiary.non_rsa_citizen && (
                      <Chip label="Non-RSA Citizen" color="warning" size="small" />
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Status Information
                  </Typography>
                  <Box sx={{ pl: 1 }}>
                    <Typography variant="body2">
                      <strong>Status:</strong> <Chip 
                        label={selectedBeneficiary.status || "Active"} 
                        size="small" 
                        color={
                          selectedBeneficiary.status === 'Active' ? 'success' :
                          selectedBeneficiary.status === 'Completed' ? 'primary' :
                          selectedBeneficiary.status === 'Graduated' ? 'warning' : 'default'
                        }
                      />
                    </Typography>
                    <Typography variant="body2">
                      <strong>Date Added:</strong> {new Date(selectedBeneficiary.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
              <Button onClick={() => setOpenViewDialog(false)} color="inherit">
                Close
              </Button>
              <Button 
                onClick={() => {
                  setOpenViewDialog(false);
                  handleEditClick();
                }}
                variant="outlined"
                color="primary"
              >
                Edit
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* MENU */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleEditClick}>
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: "error.main" }}>
          Delete
        </MenuItem>
      </Menu>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ minWidth: 300 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Beneficiaries;