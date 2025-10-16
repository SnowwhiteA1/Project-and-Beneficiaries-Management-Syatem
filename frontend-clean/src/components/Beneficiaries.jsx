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
    const fetchBeneficiaries = async () => {
      try {
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
      } finally {
        setLoading(false);
      }
    };
    fetchBeneficiaries();
  }, [projectId]);

  // Handle form input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Add beneficiary
  const handleAddBeneficiary = async () => {
    try {
      // Basic validation
      if (!formData.learner_first_name.trim() || !formData.learner_surname.trim()) {
        alert("Please fill at least first name and last name");
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
        // Don't set Content-Type header for FormData - browser will set it automatically with boundary
      });

      const responseText = await res.text();
      console.log("Raw response:", responseText);

      if (!res.ok) {
        throw new Error(`Server error: ${res.status} - ${responseText}`);
      }

      const result = JSON.parse(responseText);
      console.log("Success:", result);
      
      // Refresh the list
      try {
        const refreshRes = await fetch(`http://127.0.0.1:5050/beneficiaries/${projectId}`);
        if (refreshRes.ok) {
          const updatedBeneficiaries = await refreshRes.json();
          setBeneficiaries(updatedBeneficiaries);
        }
      } catch (refreshError) {
        console.error("Error refreshing list:", refreshError);
        // Continue even if refresh fails
      }

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
      
      alert("Beneficiary added successfully!");
      
    } catch (err) {
      console.error("Error details:", err);
      alert(`Error adding beneficiary: ${err.message}`);
    }
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
        <Typography variant="h5">
          Beneficiaries for Project #{projectId}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add Beneficiary
        </Button>
      </Box>

      {beneficiaries.length === 0 ? (
        <Typography variant="h6" sx={{ textAlign: 'center', mt: 4 }}>
          No beneficiaries found for this project.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {beneficiaries.map((b) => (
            <Grid item xs={12} sm={6} md={4} key={b.id}>
              <Card sx={{ borderRadius: "12px", boxShadow: 3, p: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {b.learner_first_name} {b.learner_surname}
                  </Typography>
                  <Typography variant="body2"><strong>ID:</strong> {b.learner_id_number}</Typography>
                  <Typography variant="body2"><strong>Programme:</strong> {b.learning_programme_type}</Typography>
                  <Typography variant="body2"><strong>Employer:</strong> {b.employer_name}</Typography>
                  <Typography variant="body2"><strong>Qualification:</strong> {b.programme_description}</Typography>
                  <Typography variant="body2"><strong>Email:</strong> {b.learner_email}</Typography>
                  <Typography variant="body2"><strong>Contact:</strong> {b.learner_contact_number}</Typography>
                  <Typography variant="body2">
                    <strong>Duration:</strong> {b.programme_start_date} → {b.programme_completion_date}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
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

      <Box mt={3}>
        <Button onClick={() => navigate(-1)} variant="outlined">
          Back to Projects
        </Button>
      </Box>
    </Box>
  );
};

export default Beneficiaries;