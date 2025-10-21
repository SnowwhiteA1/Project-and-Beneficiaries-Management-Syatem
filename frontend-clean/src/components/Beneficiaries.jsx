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
  
  const [formData, setFormData] = useState({
    learner_first_name: "",
    learner_surname: "",
    learner_initials: "",
    learner_id_number: "",
    learner_title: "",
    learning_programme_type: "",
    programme_start_date: "",
    programme_completion_date: "",
    programme_description: "",
    employer_name: "",
    learner_contact_number: "",
    learner_email: "",
    uploaded_file: null,
  });

  const fieldLabels = {
    learner_first_name: "First Name *",
    learner_surname: "Last Name *", 
    learner_initials: "Initials",
    learner_id_number: "ID Number",
    learner_title: "Title",
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

  const fetchBeneficiaries = async () => {
    try {
      setLoading(true);
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

  // Add beneficiary
  const handleAddBeneficiary = async () => {
    try {
      const formDataToSend = new FormData();

      // Append all fields
      Object.keys(formData).forEach(key => {
        if (key !== "uploaded_file") {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append project ID
      formDataToSend.append('project_enrolled', projectId);

      // Append uploaded file if exists
      if (formData.uploaded_file) {
        formDataToSend.append('uploaded_file', formData.uploaded_file);
      }

      const res = await fetch("http://127.0.0.1:5050/beneficiaries", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add beneficiary");

      showSnackbar("Beneficiary added successfully!");
      setFormData({
        learner_first_name: "",
        learner_surname: "",
        learner_initials: "",
        learner_id_number: "",
        learner_title: "",
        learning_programme_type: "",
        programme_start_date: "",
        programme_completion_date: "",
        programme_description: "",
        employer_name: "",
        learner_contact_number: "",
        learner_email: "",
        uploaded_file: null,
      });
      setOpenDialog(false);
      fetchBeneficiaries();
    } catch (err) {
      console.error(err);
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
                  border: isActive ? '2px solid #4CAF50' : '2px solid transparent',
                  transition: 'all 0.3s ease',
                  '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' }
                }}>
                  <CardContent sx={{ pt: 1 }}>
                    <Typography variant="h6" gutterBottom sx={{ pr: 4 }}>
                      {b.learner_first_name} {b.learner_surname}
                      {b.learner_initials && ` (${b.learner_initials})`}
                    </Typography>
                    
                    <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={b.learning_programme_type || "No Programme"} size="small" color="primary" variant="outlined"/>
                      {isActive && <Chip label="Active" size="small" color="success" />}
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {b.learner_id_number && <Typography variant="body2"><strong>ID:</strong> {b.learner_id_number}</Typography>}
                      {b.employer_name && <Typography variant="body2"><strong>Employer:</strong> {b.employer_name}</Typography>}
                      {b.programme_description && <Typography variant="body2"><strong>Qualification:</strong> {b.programme_description}</Typography>}
                      {b.learner_email && <Typography variant="body2"><strong>Email:</strong> {b.learner_email}</Typography>}
                      {b.learner_contact_number && <Typography variant="body2"><strong>Contact:</strong> {b.learner_contact_number}</Typography>}
                      <Typography variant="body2"><strong>Duration:</strong> {formatDisplayDate(b.programme_start_date)} → {formatDisplayDate(b.programme_completion_date)}</Typography>
                      {b.uploaded_file && (
                        <Typography variant="body2">
                          <strong>File:</strong> <a href={`http://127.0.0.1:5050/uploads/${b.uploaded_file}`} target="_blank" rel="noreferrer">View</a>
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

      {/* Add Beneficiary Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="md">
        <DialogTitle>Add New Beneficiary</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {Object.keys(formData).filter(f => f !== 'uploaded_file').map((field) => (
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

            {/* File Upload */}
            <Grid item xs={12}>
              <input type="file" onChange={handleFileChange} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddBeneficiary}>
            Save Beneficiary
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
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
