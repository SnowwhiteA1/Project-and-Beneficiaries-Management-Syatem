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

  // Simplified form for basic information
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    id_number: "",
    gender: "",
    age: "",
    mobile_phone: "",
    email: "",
    residential_area: "",
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
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      id_number: "",
      gender: "",
      age: "",
      mobile_phone: "",
      email: "",
      residential_area: "",
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

      const response = await axios.post(
        `${API_BASE}/api/projects/${projectId}/beneficiaries`,
        formData
      );

      showSnackbar("Beneficiary added successfully!");
      setOpenDialog(false);
      resetForm();
      fetchProjectAndBeneficiaries();
    } catch (err) {
      console.error("Error adding beneficiary:", err);
      showSnackbar(
        err.response?.data?.error || "Failed to add beneficiary",
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
    setFormData({
      first_name: selectedBeneficiary.first_name || "",
      last_name: selectedBeneficiary.last_name || "",
      id_number: selectedBeneficiary.id_number || "",
      gender: selectedBeneficiary.gender || "",
      age: selectedBeneficiary.age || "",
      mobile_phone: selectedBeneficiary.mobile_phone || "",
      email: selectedBeneficiary.email || "",
      residential_area: selectedBeneficiary.residential_area || "",
    });
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
          >
            Back to Projects
          </Button>
          <Typography variant="h4" fontWeight="bold">
            Beneficiaries
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Project: {projectTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {beneficiaries.length} beneficiary{beneficiaries.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          color="warning"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          size="large"
        >
          Add Beneficiary
        </Button>
      </Box>

      {/* BENEFICIARIES GRID */}
      {beneficiaries.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center", mt: 4 }}>
          <PersonIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No beneficiaries yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Click "Add Beneficiary" to add beneficiaries to this project
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Add First Beneficiary
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {beneficiaries.map((beneficiary) => (
            <Grid item xs={12} sm={6} md={4} key={beneficiary.id}>
              <Card sx={{ height: "100%", position: "relative", '&:hover': { boxShadow: 6 } }}>
                <IconButton
                  sx={{ position: "absolute", right: 8, top: 8, zIndex: 1 }}
                  onClick={(e) => handleMenuOpen(e, beneficiary)}
                >
                  <MoreVertIcon />
                </IconButton>

                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar sx={{ bgcolor: "primary.main", mr: 2, width: 50, height: 50 }}>
                      {beneficiary.first_name?.charAt(0)?.toUpperCase() || "B"}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {beneficiary.first_name} {beneficiary.last_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ID: {beneficiary.id_number || "N/A"}
                      </Typography>
                    </Box>
                  </Box>

                  <Stack spacing={1} sx={{ mt: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <PersonIcon sx={{ mr: 1, fontSize: 20, color: "text.secondary" }} />
                      <Typography variant="body2">
                        {beneficiary.gender || "Not specified"} • {beneficiary.age || "N/A"} years
                      </Typography>
                    </Box>
                    
                    {beneficiary.mobile_phone && (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <PhoneIcon sx={{ mr: 1, fontSize: 20, color: "text.secondary" }} />
                        <Typography variant="body2">
                          {beneficiary.mobile_phone}
                        </Typography>
                      </Box>
                    )}
                    
                    {beneficiary.email && (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <EmailIcon sx={{ mr: 1, fontSize: 20, color: "text.secondary" }} />
                        <Typography variant="body2">
                          {beneficiary.email}
                        </Typography>
                      </Box>
                    )}
                    
                    {beneficiary.residential_area && (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <HomeIcon sx={{ mr: 1, fontSize: 20, color: "text.secondary" }} />
                        <Typography variant="body2">
                          {beneficiary.residential_area}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                  
                  {beneficiary.created_at && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
                      Added: {new Date(beneficiary.created_at).toLocaleDateString()}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ADD/EDIT DIALOG */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          {isEdit ? "Edit Beneficiary" : "Add New Beneficiary"}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="First Name *"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                fullWidth
                required
              />
              
              <TextField
                label="Last Name *"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Box>
            
            <TextField
              label="ID Number *"
              name="id_number"
              value={formData.id_number}
              onChange={handleInputChange}
              fullWidth
              required
            />
            
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleInputChange}
                fullWidth
              />
              
              <FormControl fullWidth>
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
            </Box>
            
            <TextField
              label="Mobile Phone"
              name="mobile_phone"
              value={formData.mobile_phone}
              onChange={handleInputChange}
              fullWidth
            />
            
            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              fullWidth
            />
            
            <TextField
              label="Residential Area"
              name="residential_area"
              multiline
              rows={2}
              value={formData.address}
              onChange={handleInputChange}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {isEdit ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* MENU */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditClick}>Edit</MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: "error.main" }}>
          Delete
        </MenuItem>
      </Menu>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Beneficiaries;