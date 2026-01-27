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
  FormControlLabel
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

const API_BASE = "http://127.0.0.1:5050";

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

  // Simplified form with only essential fields
  const [formData, setFormData] = useState({
    // Required fields
    first_name: "",
    last_name: "",
    id_number: "",
    
    // Basic personal info
    gender: "",
    age: "",
    race: "",
    mobile_phone: "",
    email: "",
    
    // Address info
    residential_area: "",
    learner_province: "",
    learner_municipality: "",
    
    // Checkboxes with default values
    disability: false,
    youth: false,
    non_rsa_citizen: false,
    seta_funded: false,
    
    // Default values for other required fields
    initials: "",
    title: "",
    guardian_contact: "",
    urban_rural: "",
    physical_address_code: "",
    stats_area_code: "",
    home_language: "",
    learning_programme_type: "",
    ofo_code: "",
    nqf_level: 0,
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
    amount_spent_per_learner: 0,
    learnership_id: "",
    qualification_id: "",
    non_nqf_subfield_id: "",
    non_nqf_status_id: "",
    non_nqf_credit: "",
    unit_standard_id: "",
    agreement_number: "",
    last_school_emis: "",
    last_school_year: 0
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
        setProjectTitle(projectRes.data.title || `Project #${projectId}`);
      }
      
      // Fetch beneficiaries
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
    
    // Handle different input types
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else if (type === 'number') {
      setFormData({
        ...formData,
        [name]: value === '' ? 0 : parseFloat(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const resetForm = () => {
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
      title: "",
      guardian_contact: "",
      urban_rural: "",
      physical_address_code: "",
      stats_area_code: "",
      home_language: "",
      learning_programme_type: "",
      ofo_code: "",
      nqf_level: 0,
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
      amount_spent_per_learner: 0,
      learnership_id: "",
      qualification_id: "",
      non_nqf_subfield_id: "",
      non_nqf_status_id: "",
      non_nqf_credit: "",
      unit_standard_id: "",
      agreement_number: "",
      last_school_emis: "",
      last_school_year: 0
    });
    setSelectedBeneficiary(null);
    setIsEdit(false);
  };

  const handleAddBeneficiary = async () => {
    try {
      // Validate required fields
      if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.id_number.trim()) {
        showSnackbar("First name, last name, and ID number are required", "error");
        return;
      }

      console.log("📝 Adding beneficiary with data:", formData);
      
      // Prepare data for backend
      const dataToSend = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
        nqf_level: formData.nqf_level ? parseInt(formData.nqf_level) : null,
        last_school_year: formData.last_school_year ? parseInt(formData.last_school_year) : null,
        amount_spent_per_learner: formData.amount_spent_per_learner ? parseFloat(formData.amount_spent_per_learner) : 0
      };

      const response = await axios.post(
        `${API_BASE}/api/projects/${projectId}/beneficiaries`,
        dataToSend
      );

      console.log("✅ Beneficiary added successfully:", response.data);
      showSnackbar("Beneficiary added successfully!");
      setOpenDialog(false);
      resetForm();
      fetchProjectAndBeneficiaries();
    } catch (err) {
      console.error("❌ Error adding beneficiary:", err);
      console.error("Error response:", err.response?.data);
      showSnackbar(
        err.response?.data?.error || "Failed to add beneficiary. Check console for details.",
        "error"
      );
    }
  };

  const handleUpdateBeneficiary = async () => {
    try {
      if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.id_number.trim()) {
        showSnackbar("First name, last name, and ID number are required", "error");
        return;
      }

      await axios.put(
        `${API_BASE}/api/beneficiaries/${selectedBeneficiary.id}`,
        formData
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
    // Populate form with selected beneficiary data
    const beneficiaryData = {
      first_name: selectedBeneficiary.first_name || "",
      last_name: selectedBeneficiary.last_name || "",
      id_number: selectedBeneficiary.id_number || "",
      gender: selectedBeneficiary.gender || "",
      age: selectedBeneficiary.age || "",
      mobile_phone: selectedBeneficiary.mobile_phone || "",
      email: selectedBeneficiary.email || "",
      residential_area: selectedBeneficiary.residential_area || "",
      // Add default values for other fields
      race: selectedBeneficiary.race || "",
      learner_province: selectedBeneficiary.learner_province || "",
      learner_municipality: selectedBeneficiary.learner_municipality || "",
      disability: selectedBeneficiary.disability || false,
      youth: selectedBeneficiary.youth || false,
      non_rsa_citizen: selectedBeneficiary.non_rsa_citizen || false,
      seta_funded: selectedBeneficiary.seta_funded || false,
      initials: selectedBeneficiary.initials || "",
      title: selectedBeneficiary.title || "",
      guardian_contact: selectedBeneficiary.guardian_contact || "",
      urban_rural: selectedBeneficiary.urban_rural || "",
      physical_address_code: selectedBeneficiary.physical_address_code || "",
      stats_area_code: selectedBeneficiary.stats_area_code || "",
      home_language: selectedBeneficiary.home_language || "",
      learning_programme_type: selectedBeneficiary.learning_programme_type || "",
      ofo_code: selectedBeneficiary.ofo_code || "",
      nqf_level: selectedBeneficiary.nqf_level || 0,
      qualification_description: selectedBeneficiary.qualification_description || "",
      employer_name: selectedBeneficiary.employer_name || "",
      employer_sdl_number: selectedBeneficiary.employer_sdl_number || "",
      employer_contact_details: selectedBeneficiary.employer_contact_details || "",
      training_provider_name: selectedBeneficiary.training_provider_name || "",
      training_provider_sdl_number: selectedBeneficiary.training_provider_sdl_number || "",
      training_provider_contact_details: selectedBeneficiary.training_provider_contact_details || "",
      training_provider_type: selectedBeneficiary.training_provider_type || "",
      training_provider_province: selectedBeneficiary.training_provider_province || "",
      training_provider_code: selectedBeneficiary.training_provider_code || "",
      training_provider_etqa_id: selectedBeneficiary.training_provider_etqa_id || "",
      training_provider_postal_address: selectedBeneficiary.training_provider_postal_address || "",
      training_provider_physical_address: selectedBeneficiary.training_provider_physical_address || "",
      amount_spent_per_learner: selectedBeneficiary.amount_spent_per_learner || 0,
      learnership_id: selectedBeneficiary.learnership_id || "",
      qualification_id: selectedBeneficiary.qualification_id || "",
      non_nqf_subfield_id: selectedBeneficiary.non_nqf_subfield_id || "",
      non_nqf_status_id: selectedBeneficiary.non_nqf_status_id || "",
      non_nqf_credit: selectedBeneficiary.non_nqf_credit || "",
      unit_standard_id: selectedBeneficiary.unit_standard_id || "",
      agreement_number: selectedBeneficiary.agreement_number || "",
      last_school_emis: selectedBeneficiary.last_school_emis || "",
      last_school_year: selectedBeneficiary.last_school_year || 0
    };
    
    setFormData(beneficiaryData);
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
            onClick={() => navigate(-1)}
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
          onClick={() => setOpenDialog(true)}
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
            onClick={() => setOpenDialog(true)}
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
        maxWidth="sm"
        scroll="paper"
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            {isEdit ? "Edit Beneficiary" : "Add New Beneficiary"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Project: {projectTitle}
          </Typography>
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
              />
              
              <TextField
                label="Last Name *"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                fullWidth
                required
                size="small"
              />
            </Box>
            
            <TextField
              label="ID Number *"
              name="id_number"
              value={formData.id_number}
              onChange={handleInputChange}
              fullWidth
              required
              size="small"
            />
            
            {/* Personal Information */}
            <Typography variant="subtitle2" color="primary" fontWeight="bold" sx={{ mt: 2 }}>
              Personal Information
            </Typography>
            
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                fullWidth
                size="small"
                select
              >
                <MenuItem value=""><em>Select Gender</em></MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
              
              <TextField
                label="Age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleInputChange}
                fullWidth
                size="small"
              />
            </Box>
            
            <TextField
              label="Race"
              name="race"
              value={formData.race}
              onChange={handleInputChange}
              fullWidth
              size="small"
              select
            >
              <MenuItem value=""><em>Select Race</em></MenuItem>
              <MenuItem value="African">African</MenuItem>
              <MenuItem value="Coloured">Coloured</MenuItem>
              <MenuItem value="Indian">Indian</MenuItem>
              <MenuItem value="White">White</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
            
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
            
            <Box sx={{ display: "flex", flexWrap: 'wrap', gap: 2 }}>
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
                label="Disability"
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
                label="Youth"
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
            
            {/* Optional fields (hidden but sent with default values) */}
            <input type="hidden" name="initials" value={formData.initials} />
            <input type="hidden" name="title" value={formData.title} />
            <input type="hidden" name="guardian_contact" value={formData.guardian_contact} />
            <input type="hidden" name="urban_rural" value={formData.urban_rural} />
            <input type="hidden" name="physical_address_code" value={formData.physical_address_code} />
            <input type="hidden" name="stats_area_code" value={formData.stats_area_code} />
            <input type="hidden" name="home_language" value={formData.home_language} />
            <input type="hidden" name="learning_programme_type" value={formData.learning_programme_type} />
            <input type="hidden" name="ofo_code" value={formData.ofo_code} />
            <input type="hidden" name="nqf_level" value={formData.nqf_level} />
            <input type="hidden" name="qualification_description" value={formData.qualification_description} />
            <input type="hidden" name="employer_name" value={formData.employer_name} />
            <input type="hidden" name="employer_sdl_number" value={formData.employer_sdl_number} />
            <input type="hidden" name="employer_contact_details" value={formData.employer_contact_details} />
            <input type="hidden" name="training_provider_name" value={formData.training_provider_name} />
            <input type="hidden" name="training_provider_sdl_number" value={formData.training_provider_sdl_number} />
            <input type="hidden" name="training_provider_contact_details" value={formData.training_provider_contact_details} />
            <input type="hidden" name="training_provider_type" value={formData.training_provider_type} />
            <input type="hidden" name="training_provider_province" value={formData.training_provider_province} />
            <input type="hidden" name="training_provider_code" value={formData.training_provider_code} />
            <input type="hidden" name="training_provider_etqa_id" value={formData.training_provider_etqa_id} />
            <input type="hidden" name="training_provider_postal_address" value={formData.training_provider_postal_address} />
            <input type="hidden" name="training_provider_physical_address" value={formData.training_provider_physical_address} />
            <input type="hidden" name="amount_spent_per_learner" value={formData.amount_spent_per_learner} />
            <input type="hidden" name="learnership_id" value={formData.learnership_id} />
            <input type="hidden" name="qualification_id" value={formData.qualification_id} />
            <input type="hidden" name="non_nqf_subfield_id" value={formData.non_nqf_subfield_id} />
            <input type="hidden" name="non_nqf_status_id" value={formData.non_nqf_status_id} />
            <input type="hidden" name="non_nqf_credit" value={formData.non_nqf_credit} />
            <input type="hidden" name="unit_standard_id" value={formData.unit_standard_id} />
            <input type="hidden" name="agreement_number" value={formData.agreement_number} />
            <input type="hidden" name="last_school_emis" value={formData.last_school_emis} />
            <input type="hidden" name="last_school_year" value={formData.last_school_year} />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" color="warning">
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