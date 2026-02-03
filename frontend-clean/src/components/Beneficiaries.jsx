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
  FormHelperText
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import HomeIcon from "@mui/icons-material/Home";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = "http://localhost:5050";

const Beneficiaries = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectTitle, setProjectTitle] = useState("");

  const [openDialog, setOpenDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);

  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Form state with ALL fields the backend expects
  const [formData, setFormData] = useState({
    // Personal Information (Required)
    first_name: "",
    last_name: "",
    id_number: "",
    
    // Personal Details
    gender: "",
    age: "",
    race: "",
    mobile_phone: "",
    email: "",
    residential_area: "",
    learner_province: "",
    learner_municipality: "",
    
    // Checkboxes
    disability: false,
    youth: false,
    non_rsa_citizen: false,
    seta_funded: false,
    
    // ALL other fields from database table
    initials: "",
    home_language: "English",
    learning_programme_type: "Training",
    ofo_code: "",
    nqf_level: "",
    qualification_description: "",
    employer_name: "",
    employer_sdl_number: "",
    employer_contact_details: "",
    training_provider_name: "",
    training_provider_sdl_number: "",
    training_provider_contact_details: "",
    training_provider_type: "",
    training_provider_province: "",
    training_provider_code: "",
    training_provider_etqa_id: "",
    training_provider_postal_address: "",
    training_provider_physical_address: "",
    amount_spent_per_learner: "0",
    learnership_id: "",
    qualification_id: "",
    non_nqf_subfield_id: "",
    non_nqf_status_id: "",
    non_nqf_credit: "",
    unit_standard_id: "",
    agreement_number: "",
    last_school_emis: "",
    last_school_year: "",
    
    // Fields from database that are in backend mapping
    disability_type: "",
    area_type: "",
    physical_address_line1: "",
    physical_address_line2: "",
    physical_address_code: "",
    postal_address_line1: "",
    postal_address_line2: "",
    postal_code: "",
    programme_start_date: new Date().toISOString().split('T')[0],
    programme_completion_date: null,
    certificate_issue_date: null,
    training_provider_accreditation_start_date: null,
    training_provider_province_code: "",
    parent_guardian_mobile: "",
    parent_guardian_email: "",
    project_number: "",
    activity_number: "",
    app_sub_programme: "",
    black_designated_groups: "0",
    black_females: "0",
    black_males: "0",
    coloured_females: "0",
    coloured_males: "0",
    indian_females: "0",
    indian_males: "0",
    white_females: "0",
    white_males: "0",
    disabled_females: "0",
    disabled_males: "0",
    youth_females: "0",
    youth_males: "0",
    non_rsa_citizen_females: "0",
    non_rsa_citizen_males: "0",
    valid_id_number_length: true,
    valid_age_for_youth: true,
    correctly_reported_youth: true,
    correctly_reported_gender: true,
    correctly_reported_race: true,
    skills: "",
    employment_status: "",
    current_employer: "",
    monthly_income: "0",
    programme_outcome: "",
    notes: "",
    validation_errors: "",
    beneficiary_status: "Current"
  });

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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else if (name === 'age' || name === 'nqf_level' || name === 'last_school_year') {
      // Handle numeric fields
      setFormData({
        ...formData,
        [name]: value === '' ? '' : value
      });
    } else if (name === 'amount_spent_per_learner' || name === 'monthly_income') {
      // Handle decimal fields
      setFormData({
        ...formData,
        [name]: value === '' ? '0' : value
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0];
    
    setFormData({
      first_name: "",
      last_name: "",
      id_number: "",
      gender: "",
      age: "",
      race: "",
      mobile_phone: "",
      email: "",
      residential_area: "",
      learner_province: "",
      learner_municipality: "",
      disability: false,
      youth: false,
      non_rsa_citizen: false,
      seta_funded: false,
      initials: "",
      home_language: "English",
      learning_programme_type: "Training",
      ofo_code: "",
      nqf_level: "",
      qualification_description: "",
      employer_name: "",
      employer_sdl_number: "",
      employer_contact_details: "",
      training_provider_name: "",
      training_provider_sdl_number: "",
      training_provider_contact_details: "",
      training_provider_type: "",
      training_provider_province: "",
      training_provider_code: "",
      training_provider_etqa_id: "",
      training_provider_postal_address: "",
      training_provider_physical_address: "",
      amount_spent_per_learner: "0",
      learnership_id: "",
      qualification_id: "",
      non_nqf_subfield_id: "",
      non_nqf_status_id: "",
      non_nqf_credit: "",
      unit_standard_id: "",
      agreement_number: "",
      last_school_emis: "",
      last_school_year: "",
      disability_type: "",
      area_type: "",
      physical_address_line1: "",
      physical_address_line2: "",
      physical_address_code: "",
      postal_address_line1: "",
      postal_address_line2: "",
      postal_code: "",
      programme_start_date: today,
      programme_completion_date: null,
      certificate_issue_date: null,
      training_provider_accreditation_start_date: null,
      training_provider_province_code: "",
      parent_guardian_mobile: "",
      parent_guardian_email: "",
      project_number: "",
      activity_number: "",
      app_sub_programme: "",
      black_designated_groups: "0",
      black_females: "0",
      black_males: "0",
      coloured_females: "0",
      coloured_males: "0",
      indian_females: "0",
      indian_males: "0",
      white_females: "0",
      white_males: "0",
      disabled_females: "0",
      disabled_males: "0",
      youth_females: "0",
      youth_males: "0",
      non_rsa_citizen_females: "0",
      non_rsa_citizen_males: "0",
      valid_id_number_length: true,
      valid_age_for_youth: true,
      correctly_reported_youth: true,
      correctly_reported_gender: true,
      correctly_reported_race: true,
      skills: "",
      employment_status: "",
      current_employer: "",
      monthly_income: "0",
      programme_outcome: "",
      notes: "",
      validation_errors: "",
      beneficiary_status: "Current"
    });
    setSelectedBeneficiary(null);
    setIsEdit(false);
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

    // Prepare COMPLETE data for backend - ALL fields as strings
    const dataToSend = {
      // Personal Information
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      id_number: formData.id_number.trim(),
      
      // Personal Details - send empty strings instead of null
      gender: formData.gender || "",
      age: formData.age ? parseInt(formData.age) : null,
      race: formData.race || "",
      mobile_phone: formData.mobile_phone || "",
      email: formData.email || "",
      residential_area: formData.residential_area || "",
      learner_province: formData.learner_province || "",
      learner_municipality: formData.learner_municipality || "",
      
      // Checkboxes
      disability: Boolean(formData.disability),
      youth: Boolean(formData.youth),
      non_rsa_citizen: Boolean(formData.non_rsa_citizen),
      seta_funded: Boolean(formData.seta_funded),
      
      // ALL other required fields - send empty strings
      initials: formData.initials || "",
      home_language: formData.home_language || "English",
      learning_programme_type: formData.learning_programme_type || "Training",
      ofo_code: formData.ofo_code || "",
      nqf_level: formData.nqf_level || "",
      qualification_description: formData.qualification_description || "",
      employer_name: formData.employer_name || "",
      employer_sdl_number: formData.employer_sdl_number || "",
      employer_contact_details: formData.employer_contact_details || "",
      training_provider_name: formData.training_provider_name || "",
      training_provider_sdl_number: formData.training_provider_sdl_number || "",
      training_provider_contact_details: formData.training_provider_contact_details || "",
      training_provider_type: formData.training_provider_type || "",
      training_provider_province: formData.training_provider_province || "",
      training_provider_code: formData.training_provider_code || "",
      training_provider_etqa_id: formData.training_provider_etqa_id || "",
      training_provider_postal_address: formData.training_provider_postal_address || "",
      training_provider_physical_address: formData.training_provider_physical_address || "",
      amount_spent_per_learner: formData.amount_spent_per_learner ? parseFloat(formData.amount_spent_per_learner) : 0,
      learnership_id: formData.learnership_id || "",
      qualification_id: formData.qualification_id || "",
      non_nqf_subfield_id: formData.non_nqf_subfield_id || "",
      non_nqf_status_id: formData.non_nqf_status_id || "",
      non_nqf_credit: formData.non_nqf_credit || "",
      unit_standard_id: formData.unit_standard_id || "",
      agreement_number: formData.agreement_number || "",
      last_school_emis: formData.last_school_emis || "",
      last_school_year: formData.last_school_year || "",
      
      // Additional database fields - send empty strings
      disability_type: formData.disability_type || "",
      area_type: formData.area_type || "",
      physical_address_line1: formData.physical_address_line1 || "",
      physical_address_line2: formData.physical_address_line2 || "",
      physical_address_code: formData.physical_address_code || "",
      postal_address_line1: formData.postal_address_line1 || "",
      postal_address_line2: formData.postal_address_line2 || "",
      postal_code: formData.postal_code || "",
      programme_start_date: formData.programme_start_date || new Date().toISOString().split('T')[0],
      programme_completion_date: formData.programme_completion_date || "",
      certificate_issue_date: formData.certificate_issue_date || "",
      training_provider_accreditation_start_date: formData.training_provider_accreditation_start_date || "",
      training_provider_province_code: formData.training_provider_province_code || "",
      parent_guardian_mobile: formData.parent_guardian_mobile || "",
      parent_guardian_email: formData.parent_guardian_email || "",
      project_number: formData.project_number || "",
      activity_number: formData.activity_number || "",
      app_sub_programme: formData.app_sub_programme || "",
      black_designated_groups: parseInt(formData.black_designated_groups) || 0,
      black_females: parseInt(formData.black_females) || 0,
      black_males: parseInt(formData.black_males) || 0,
      coloured_females: parseInt(formData.coloured_females) || 0,
      coloured_males: parseInt(formData.coloured_males) || 0,
      indian_females: parseInt(formData.indian_females) || 0,
      indian_males: parseInt(formData.indian_males) || 0,
      white_females: parseInt(formData.white_females) || 0,
      white_males: parseInt(formData.white_males) || 0,
      disabled_females: parseInt(formData.disabled_females) || 0,
      disabled_males: parseInt(formData.disabled_males) || 0,
      youth_females: parseInt(formData.youth_females) || 0,
      youth_males: parseInt(formData.youth_males) || 0,
      non_rsa_citizen_females: parseInt(formData.non_rsa_citizen_females) || 0,
      non_rsa_citizen_males: parseInt(formData.non_rsa_citizen_males) || 0,
      valid_id_number_length: Boolean(formData.valid_id_number_length),
      valid_age_for_youth: Boolean(formData.valid_age_for_youth),
      correctly_reported_youth: Boolean(formData.correctly_reported_youth),
      correctly_reported_gender: Boolean(formData.correctly_reported_gender),
      correctly_reported_race: Boolean(formData.correctly_reported_race),
      skills: formData.skills || "",
      employment_status: formData.employment_status || "",
      current_employer: formData.current_employer || "",
      monthly_income: formData.monthly_income ? parseFloat(formData.monthly_income) : 0,
      programme_outcome: formData.programme_outcome || "",
      notes: formData.notes || "",
      validation_errors: formData.validation_errors || "",
      beneficiary_status: formData.beneficiary_status || "Current"
    };

    // Fix: Ensure all text fields are strings, not null
    Object.keys(dataToSend).forEach(key => {
      if (dataToSend[key] === null && typeof dataToSend[key] === 'object') {
        dataToSend[key] = "";
      }
    });

    console.log("📤 Sending COMPLETE data to backend:", JSON.stringify(dataToSend, null, 2));
    console.log("📤 Total fields being sent:", Object.keys(dataToSend).length);

    const response = await axios.post(
      `${API_BASE}/api/projects/${projectId}/beneficiaries`,
      dataToSend,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    console.log("✅ Beneficiary added successfully:", response.data);
    showSnackbar("Beneficiary added successfully!");
    setOpenDialog(false);
    resetForm();
    fetchProjectAndBeneficiaries();
  } catch (err) {
    console.error("❌ ERROR adding beneficiary:", err);
    console.error("❌ Error response data:", err.response?.data);
    console.error("❌ Error status:", err.response?.status);
    console.error("❌ Error headers:", err.response?.headers);
    
    let errorMessage = "Failed to add beneficiary. ";
    
    if (err.response?.data?.error) {
      errorMessage += `Server says: ${err.response.data.error}`;
    } else if (err.message) {
      errorMessage += `Error: ${err.message}`;
    }
    
    showSnackbar(errorMessage, "error");
  }
};

  // Keep the rest of your component the same (handleUpdateBeneficiary, handleDeleteBeneficiary, etc.)
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
        email: formData.email || "",
        residential_area: formData.residential_area || "",
        learner_province: formData.learner_province || "",
        learner_municipality: formData.learner_municipality || "",
        disability: Boolean(formData.disability),
        youth: Boolean(formData.youth),
        non_rsa_citizen: Boolean(formData.non_rsa_citizen)
      };

      const response = await axios.put(
        `${API_BASE}/api/beneficiaries/${selectedBeneficiary.id}`,
        updateData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
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

    // For editing, we only need to populate the visible fields
    setFormData(prev => ({
      ...prev,
      first_name: selectedBeneficiary.first_name || "",
      last_name: selectedBeneficiary.last_name || "",
      id_number: selectedBeneficiary.id_number || "",
      gender: selectedBeneficiary.gender || "",
      age: selectedBeneficiary.age || "",
      race: selectedBeneficiary.race || "",
      mobile_phone: selectedBeneficiary.mobile_phone || "",
      email: selectedBeneficiary.email || "",
      residential_area: selectedBeneficiary.residential_area || "",
      learner_province: selectedBeneficiary.learner_province || "",
      learner_municipality: selectedBeneficiary.learner_municipality || "",
      disability: selectedBeneficiary.disability || false,
      youth: selectedBeneficiary.youth || false,
      non_rsa_citizen: selectedBeneficiary.non_rsa_citizen || false,
      seta_funded: selectedBeneficiary.seta_funded || false,
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

  const handleSave = () => {
    if (isEdit) {
      handleUpdateBeneficiary();
    } else {
      handleAddBeneficiary();
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
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
              <Card sx={{ 
                height: "100%", 
                position: "relative", 
                transition: 'all 0.3s ease',
                '&:hover': { 
                  boxShadow: 6,
                  transform: 'translateY(-4px)'
                }
              }}>
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
                  onClick={(e) => handleMenuOpen(e, beneficiary)}
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

      {/* ADD/EDIT DIALOG */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        fullWidth 
        maxWidth="md"
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
        
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            {/* Required Fields */}
            <Typography variant="subtitle2" color="primary" fontWeight="bold">
              Required Information
            </Typography>
            
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="First Name *"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                fullWidth
                required
                size="small"
                error={!formData.first_name.trim()}
                helperText={!formData.first_name.trim() ? "Required" : ""}
              />
              
              <TextField
                label="Last Name *"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                fullWidth
                required
                size="small"
                error={!formData.last_name.trim()}
                helperText={!formData.last_name.trim() ? "Required" : ""}
              />
            </Box>
            
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="ID Number *"
                name="id_number"
                value={formData.id_number}
                onChange={handleInputChange}
                fullWidth
                required
                size="small"
                error={!formData.id_number.trim()}
                helperText={!formData.id_number.trim() ? "Required (13 digits)" : ""}
              />
              
              <TextField
                label="Age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleInputChange}
                fullWidth
                size="small"
                inputProps={{ min: 0, max: 120 }}
              />
            </Box>
            
            {/* Personal Information */}
            <Typography variant="subtitle2" color="primary" fontWeight="bold" sx={{ mt: 2 }}>
              Personal Information
            </Typography>
            
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  label="Gender"
                >
                  <MenuItem value=""><em>Select Gender</em></MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth size="small">
                <InputLabel>Race</InputLabel>
                <Select
                  name="race"
                  value={formData.race}
                  onChange={handleInputChange}
                  label="Race"
                >
                  <MenuItem value=""><em>Select Race</em></MenuItem>
                  <MenuItem value="African">African</MenuItem>
                  <MenuItem value="Coloured">Coloured</MenuItem>
                  <MenuItem value="Indian">Indian</MenuItem>
                  <MenuItem value="White">White</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            {/* Contact Information */}
            <Typography variant="subtitle2" color="primary" fontWeight="bold" sx={{ mt: 2 }}>
              Contact Information
            </Typography>
            
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Mobile Phone"
                name="mobile_phone"
                value={formData.mobile_phone}
                onChange={handleInputChange}
                fullWidth
                size="small"
              />
              
              <TextField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                fullWidth
                size="small"
              />
            </Box>
            
            {/* Address Information */}
            <Typography variant="subtitle2" color="primary" fontWeight="bold" sx={{ mt: 2 }}>
              Address Information
            </Typography>
            
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Province"
                name="learner_province"
                value={formData.learner_province}
                onChange={handleInputChange}
                fullWidth
                size="small"
              />
              
              <TextField
                label="Municipality"
                name="learner_municipality"
                value={formData.learner_municipality}
                onChange={handleInputChange}
                fullWidth
                size="small"
              />
            </Box>
            
            <TextField
              label="Residential Area"
              name="residential_area"
              value={formData.residential_area}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={2}
              size="small"
            />
            
            {/* Checkboxes */}
            <Typography variant="subtitle2" color="primary" fontWeight="bold" sx={{ mt: 2 }}>
              Additional Information
            </Typography>
            
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.disability}
                    onChange={handleInputChange}
                    name="disability"
                    color="primary"
                    size="small"
                  />
                }
                label="Person with Disability"
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.youth}
                    onChange={handleInputChange}
                    name="youth"
                    color="primary"
                    size="small"
                  />
                }
                label="Youth (18-35 years)"
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.non_rsa_citizen}
                    onChange={handleInputChange}
                    name="non_rsa_citizen"
                    color="primary"
                    size="small"
                  />
                }
                label="Non-RSA Citizen"
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.seta_funded}
                    onChange={handleInputChange}
                    name="seta_funded"
                    color="primary"
                    size="small"
                  />
                }
                label="SETA Funded"
              />
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            color="warning"
            disabled={!formData.first_name.trim() || !formData.last_name.trim() || !formData.id_number.trim()}
          >
            {isEdit ? "Update" : "Save"} Beneficiary
          </Button>
        </DialogActions>
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