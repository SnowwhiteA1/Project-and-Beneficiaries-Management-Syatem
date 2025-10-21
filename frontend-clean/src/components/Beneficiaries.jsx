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
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Snackbar,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useParams, useNavigate } from "react-router-dom";

const companyLogo = "/logo.jpeg";

const Beneficiaries = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  
  const [formData, setFormData] = useState({
    learner_first_name: "",
    learner_surname: "",
    learner_initials: "",
    learner_id_number: "",
    learning_programme_type: "",
    programme_start_date: "",
    programme_completion_date: "",
    programme_description: "",
    employer_name: "",
    learner_contact_number: "",
    learner_email: "",
  });

  const [editFormData, setEditFormData] = useState({
    learner_first_name: "",
    learner_surname: "",
    learner_initials: "",
    learner_id_number: "",
    learning_programme_type: "",
    programme_start_date: "",
    programme_completion_date: "",
    programme_description: "",
    employer_name: "",
    learner_contact_number: "",
    learner_email: "",
  });

  // Field labels for better display
  const fieldLabels = {
    learner_first_name: "First Name *",
    learner_surname: "Last Name *", 
    learner_initials: "Initials",
    learner_id_number: "ID Number",
    learning_programme_type: "Programme Type",
    programme_start_date: "Start Date",
    programme_completion_date: "End Date",
    programme_description: "Qualification Description",
    employer_name: "Employer Name",
    learner_contact_number: "Contact Number",
    learner_email: "Email Address"
  };

  // Fetch beneficiaries
  useEffect(() => {
    fetchBeneficiaries();
  }, [projectId]);

  // Debug selected beneficiary
  useEffect(() => {
    console.log("Selected Beneficiary:", selectedBeneficiary);
  }, [selectedBeneficiary]);

  const fetchBeneficiaries = async () => {
    try {
      setLoading(true);
      console.log("Fetching beneficiaries for project:", projectId);
      const res = await fetch(`http://127.0.0.1:5050/beneficiaries/${projectId}`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("Fetched beneficiaries:", data);
      setBeneficiaries(data);
    } catch (err) {
      console.error("Error fetching beneficiaries:", err);
      showSnackbar("Error loading beneficiaries", "error");
    } finally {
      setLoading(false);
    }
  };

  // Show snackbar notification
  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // Handle form input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };

  // Add beneficiary
  const handleAddBeneficiary = async () => {
    try {
      // Basic validation
      if (!formData.learner_first_name.trim() || !formData.learner_surname.trim()) {
        showSnackbar("Please fill at least first name and last name", "error");
        return;
      }

      // Create FormData object
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      // Add project_id and required fields
      formDataToSend.append('project_id', projectId);
      formDataToSend.append('learner_title', 'Mr'); // Default value

      console.log("Sending form data...");

      const res = await fetch("http://127.0.0.1:5050/beneficiaries", {
        method: "POST",
        body: formDataToSend
      });

      const responseText = await res.text();
      console.log("Raw response:", responseText);

      if (!res.ok) {
        throw new Error(`Server error: ${res.status} - ${responseText}`);
      }

      const result = JSON.parse(responseText);
      console.log("Success:", result);
      
      // Refresh the list
      await fetchBeneficiaries();

      // Reset form and close dialog
      setFormData({
        learner_first_name: "",
        learner_surname: "",
        learner_initials: "",
        learner_id_number: "",
        learning_programme_type: "",
        programme_start_date: "",
        programme_completion_date: "",
        programme_description: "",
        employer_name: "",
        learner_contact_number: "",
        learner_email: "",
      });
      setOpenDialog(false);
      
      showSnackbar("Beneficiary added successfully!");
      
    } catch (err) {
      console.error("Error details:", err);
      showSnackbar(`Error adding beneficiary: ${err.message}`, "error");
    }
  };

  // Edit beneficiary
  // Edit beneficiary
const handleEditBeneficiary = async () => {
  try {
    if (!selectedBeneficiary) {
      showSnackbar("No beneficiary selected", "error");
      return;
    }

    // Basic validation
    if (!editFormData.learner_first_name.trim() || !editFormData.learner_surname.trim()) {
      showSnackbar("Please fill at least first name and last name", "error");
      return;
    }

    const formDataToSend = new FormData();
    
    // Format dates properly before sending
    Object.keys(editFormData).forEach(key => {
      let value = editFormData[key];
      
      // Ensure date fields are in YYYY-MM-DD format
      if (key.includes('date') && value) {
        try {
          // If it's already in correct format, keep it
          if (!value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              value = date.toISOString().split('T')[0];
            }
          }
        } catch (e) {
          console.warn(`Could not format date for ${key}:`, value);
        }
      }
      
      formDataToSend.append(key, value);
    });
    
    formDataToSend.append('project_id', projectId);
    formDataToSend.append('learner_title', 'Mr');

    console.log("=== EDIT BENEFICIARY ===");
    console.log("Beneficiary ID:", selectedBeneficiary.id);
    console.log("Form Data:", Object.fromEntries(formDataToSend));

    const res = await fetch(`http://127.0.0.1:5050/beneficiaries/${selectedBeneficiary.id}`, {
      method: "PUT",
      body: formDataToSend
    });

    console.log("Response status:", res.status);
    const responseText = await res.text();
    console.log("Raw response:", responseText);

    if (!res.ok) {
      // Try to parse error message
      let errorMsg = `Server error: ${res.status}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMsg = errorData.error || errorMsg;
      } catch (e) {
        errorMsg = responseText || errorMsg;
      }
      throw new Error(errorMsg);
    }

    const result = JSON.parse(responseText);
    console.log("Update success:", result);
    
    // Refresh the list
    await fetchBeneficiaries();

    // Reset and close dialogs
    setOpenEditDialog(false);
    setSelectedBeneficiary(null);
    setActionMenuAnchor(null);
    
    showSnackbar("Beneficiary updated successfully!");
    
  } catch (err) {
    console.error("Error updating beneficiary:", err);
    showSnackbar(`Error updating beneficiary: ${err.message}`, "error");
  }
};

  // Delete beneficiary
  const handleDeleteBeneficiary = async () => {
    try {
      if (!selectedBeneficiary) {
        showSnackbar("No beneficiary selected", "error");
        return;
      }

      console.log("=== DELETE BENEFICIARY ===");
      console.log("Beneficiary ID:", selectedBeneficiary.id);

      const res = await fetch(`http://127.0.0.1:5050/beneficiaries/${selectedBeneficiary.id}`, {
        method: "DELETE"
      });

      console.log("Response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.log("Error response:", errorText);
        let errorMsg = `Server error: ${res.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          errorMsg = errorText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const result = await res.json();
      console.log("Delete success:", result);
      
      // Refresh the list
      await fetchBeneficiaries();

      // Reset selection and close dialogs
      setSelectedBeneficiary(null);
      setActionMenuAnchor(null);
      setOpenDeleteDialog(false);
      
      showSnackbar("Beneficiary deleted successfully!");
      
    } catch (err) {
      console.error("Error deleting beneficiary:", err);
      showSnackbar(`Error deleting beneficiary: ${err.message}`, "error");
    }
  };

  // Action menu handlers
  const handleActionMenuOpen = (event, beneficiary) => {
    console.log("Opening action menu for beneficiary:", beneficiary);
    setActionMenuAnchor(event.currentTarget);
    setSelectedBeneficiary(beneficiary);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
  };

  const handleEditClick = () => {
  if (!selectedBeneficiary) {
    showSnackbar("No beneficiary selected", "error");
    return;
  }
  
  console.log("Editing beneficiary:", selectedBeneficiary);
  
  // Helper function to format date for input fields
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      // If it's already in YYYY-MM-DD format, return as-is
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
      }
      // Otherwise, parse and format it
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split('T')[0];
    } catch {
      return "";
    }
  };
  
  // Pre-fill edit form with current data
  setEditFormData({
    learner_first_name: selectedBeneficiary.learner_first_name || "",
    learner_surname: selectedBeneficiary.learner_surname || "",
    learner_initials: selectedBeneficiary.learner_initials || "",
    learner_id_number: selectedBeneficiary.learner_id_number || "",
    learning_programme_type: selectedBeneficiary.learning_programme_type || "",
    programme_start_date: formatDateForInput(selectedBeneficiary.programme_start_date),
    programme_completion_date: formatDateForInput(selectedBeneficiary.programme_completion_date),
    programme_description: selectedBeneficiary.programme_description || "",
    employer_name: selectedBeneficiary.employer_name || "",
    learner_contact_number: selectedBeneficiary.learner_contact_number || "",
    learner_email: selectedBeneficiary.learner_email || "",
  });
  
  setOpenEditDialog(true);
  handleActionMenuClose();
};

  const handleDeleteClick = () => {
    if (!selectedBeneficiary) {
      showSnackbar("No beneficiary selected", "error");
      return;
    }
    setOpenDeleteDialog(true);
    handleActionMenuClose();
  };

  const handleCancelDelete = () => {
    setOpenDeleteDialog(false);
    setSelectedBeneficiary(null);
  };

  // Format date for display
  const formatDisplayDate = (dateString) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Check if programme is active
  const isProgrammeActive = (startDate, endDate) => {
    if (!startDate) return false;
    const today = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    
    if (end && today > end) return false; // Completed
    return today >= start; // Active or upcoming
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
                <Card sx={{ 
                  borderRadius: "12px", 
                  boxShadow: 3, 
                  p: 2, 
                  position: 'relative',
                  border: isActive ? '2px solid #4CAF50' : '2px solid transparent',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-2px)'
                  }
                }}>
                  {/* Action Menu Button */}
                  <IconButton 
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                    onClick={(e) => handleActionMenuOpen(e, b)}
                  >
                    <MoreVertIcon />
                  </IconButton>

                  <CardContent sx={{ pt: 1 }}>
                    <Typography variant="h6" gutterBottom sx={{ pr: 4 }}>
                      {b.learner_first_name} {b.learner_surname}
                      {b.learner_initials && ` (${b.learner_initials})`}
                    </Typography>
                    
                    <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        label={b.learning_programme_type || "No Programme"} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                      {isActive && (
                        <Chip 
                          label="Active" 
                          size="small" 
                          color="success" 
                        />
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                        <strong>Duration:</strong> {formatDisplayDate(b.programme_start_date)} → {formatDisplayDate(b.programme_completion_date)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Add Beneficiary Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="md">
        <DialogTitle>Add New Beneficiary</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {Object.keys(formData).map((field) => (
              <Grid item xs={12} sm={6} key={field}>
                <TextField
                  label={fieldLabels[field]}
                  name={field}
                  value={formData[field]}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                  type={field.includes('date') ? 'date' : 'text'}
                  InputLabelProps={field.includes('date') ? { shrink: true } : {}}
                  required={fieldLabels[field].includes('*')}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddBeneficiary}>
            Save Beneficiary
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Beneficiary Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} fullWidth maxWidth="md">
        <DialogTitle>Edit Beneficiary</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {Object.keys(editFormData).map((field) => (
              <Grid item xs={12} sm={6} key={field}>
                <TextField
                  label={fieldLabels[field]}
                  name={field}
                  value={editFormData[field]}
                  onChange={handleEditInputChange}
                  fullWidth
                  size="small"
                  type={field.includes('date') ? 'date' : 'text'}
                  InputLabelProps={field.includes('date') ? { shrink: true } : {}}
                  required={fieldLabels[field].includes('*')}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditBeneficiary}>
            Update Beneficiary
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCancelDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{" "}
            <strong>
              {selectedBeneficiary?.learner_first_name} {selectedBeneficiary?.learner_surname}
            </strong>
            ? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button 
            onClick={handleDeleteBeneficiary} 
            variant="contained" 
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        <MenuItem onClick={handleEditClick}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} /> Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
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