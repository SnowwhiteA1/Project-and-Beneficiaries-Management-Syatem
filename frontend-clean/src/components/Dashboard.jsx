import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  CircularProgress,
  Alert,
  CardMedia,
  Input,
  DialogContentText
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AnalyticsIcon from "@mui/icons-material/Analytics"; // ADDED
import { useNavigate } from "react-router-dom";
import axios from "axios";

const companyLogo = "/logo.jpeg";
const API_BASE = "http://localhost:5050";
const API_URL = `${API_BASE}/api/projects`;

// Predefined options
const ACCREDITORS_LIST = ["MICSETA", "QASA"]; 
const FUNDERS_LIST = ["BankSeta", "Fasset", "Social Development", "Private Donor"]; 
const PROJECT_TYPES = ["Training", "Learnership", "Internship", "Mentorship", "Research"]; 
const STATUS_OPTIONS = ["Active", "Completed", "Planning", "On Hold"];
const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editProjectId, setEditProjectId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [openConfirmation, setOpenConfirmation] = useState(false);
  const fileInputRef = useRef(null);

  // Form fields matching backend structure
  const [name, setName] = useState("");
  const [projectType, setProjectType] = useState("");
  const [description, setDescription] = useState("");
  const [funder, setFunder] = useState("");
  const [accreditor, setAccreditor] = useState("");
  const [projectImageFile, setProjectImageFile] = useState(null);
  const [projectImagePreview, setProjectImagePreview] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("Active");

  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(API_URL);
      setProjects(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.response?.data?.error || "Failed to fetch projects from backend");
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (projectId) => {
    navigate(`/beneficiaries/${projectId}`);
  };

  // ADDED: Handle analytics navigation
  const handleAnalyticsClick = () => {
    navigate("/analytics");
  };

  const resetForm = () => {
    setName("");
    setProjectType("");
    setDescription("");
    setFunder("");
    setAccreditor("");
    setProjectImageFile(null);
    setProjectImagePreview("");
    setStartDate("");
    setEndDate("");
    setStatus("Active");
    setEditProjectId(null);
    setIsEditMode(false);
  };

  const handleOpen = () => {
    resetForm();
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    resetForm();
  };

  const handleImageUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setProjectImageFile(file);
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setProjectImagePreview(previewUrl);
    }
  };

  const prepareFormData = () => {
    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('project_type', projectType.trim());
    formData.append('description', description.trim());
    formData.append('funder', funder.trim());
    formData.append('accreditor', accreditor.trim());
    formData.append('status', status);
    
    if (startDate) formData.append('start_date', startDate);
    if (endDate) formData.append('end_date', endDate);
    
    // Append image file if selected
    if (projectImageFile) {
      formData.append('project_image', projectImageFile);
    }
    
    return formData;
  };

  const handleSaveProject = async () => {
    // Open confirmation dialog instead of saving immediately
    setOpenConfirmation(true);
  };

  const confirmSaveProject = async () => {
    setOpenConfirmation(false);
    
    // Backend requires name and project_type
    if (!name || !projectType) {
      alert("Please fill in Project Name and Project Type (required)");
      return;
    }

    try {
      setSaving(true);
      const formData = prepareFormData();
      
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };

      if (isEditMode) {
        await axios.put(`${API_URL}/${editProjectId}`, formData, config);
      } else {
        await axios.post(API_URL, formData, config);
      }
      
      handleClose();
      fetchProjects();
      alert(`Project ${isEditMode ? "updated" : "created"} successfully!`);
    } catch (err) {
      console.error("Save error:", err);
      alert(`Failed to save project: ${err.response?.data?.error || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleMenuClick = (e, project) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  const handleEdit = () => {
    const p = selectedProject;
    setIsEditMode(true);
    setEditProjectId(p.id);
    setName(p.name || "");
    setProjectType(p.project_type || "");
    setDescription(p.description || "");
    setFunder(p.funder || "");
    setAccreditor(p.accreditor || "");
    setProjectImagePreview(p.project_image_url || "");
    setStartDate(p.start_date || "");
    setEndDate(p.end_date || "");
    setStatus(p.status || "Active");
    setOpenDialog(true);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${selectedProject.name}"?`)) {
      handleMenuClose();
      return;
    }
    try {
      await axios.delete(`${API_URL}/${selectedProject.id}`);
      fetchProjects();
      alert("Project deleted successfully!");
    } catch (err) {
      console.error("Delete error:", err);
      alert(`Delete failed: ${err.response?.data?.error || err.message}`);
    }
    handleMenuClose();
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return "";
    const s = new Date(start);
    const e = new Date(end);
    const days = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    return months ? `${years} years ${months} months` : `${years} years`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
             <Box sx={{ textAlign: 'center', mb: 4, borderBottom: '2px solid #1976d2', pb: 2 }}>
               <Typography variant="h4" color="primary" fontWeight="bold">
                 JumpStart Your Career (NPO)
               </Typography>
               <Typography variant="h6" color="text.secondary">
                 Projects Over View 
               </Typography>
               <Typography variant="body2" color="text.secondary">
                 Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
               </Typography>
             </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* UPDATED: Added Analytics button to the header section */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
        <Box>
          <Typography variant="h6" sx={{ mb: 1 }}>Total Projects: {projects.length}</Typography>
          <Typography variant="body2" color="text.secondary">
            {projects.filter(p => p.status === 'Active').length} Active • 
            {projects.filter(p => p.status === 'Completed').length} Completed
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<AnalyticsIcon />}
            onClick={handleAnalyticsClick}
            sx={{ height: 40  }}
          >
            Analytics & Reports
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />} 
            onClick={handleOpen}
            sx={{ height: 40 }}
          >
            Add New Project
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {projects.map((p) => (
          <Grid item xs={12} sm={6} md={4} key={p.id}>
            <Card 
              sx={{ 
                cursor: "pointer", 
                position: "relative", 
                height: "100%",
                transition: 'all 0.3s ease',
                '&:hover': { 
                  boxShadow: 6,
                  transform: 'translateY(-4px)'
                }
              }}
              onClick={() => handleProjectClick(p.id)}
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
                  handleMenuClick(e, p);
                }}
              >
                <MoreVertIcon />
              </IconButton>
              {p.project_image_url && (
                <CardMedia
                  component="img"
                  height="140"
                  image={p.project_image_url}
                  alt={p.name}
                  sx={{ objectFit: 'cover' }}
                />
              )}
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>{p.name}</Typography>
                <Chip label={p.project_type} size="small" color="primary" sx={{ mb: 1 }} />
                <Chip label={p.status} size="small" color={p.status === "Active" ? "success" : "default"} sx={{ mb: 1, ml: 1 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 60, overflow: "hidden" }}>{p.description}</Typography>

                {(p.funder || p.accreditor) && (
                  <Box sx={{ mb: 2 }}>
                    {p.funder && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">Funder:</Typography>
                        <Chip label={p.funder} size="small" sx={{ ml: 1 }} />
                      </Box>
                    )}
                    {p.accreditor && (
                      <Box sx={{ display: '-flex', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">Accreditor:</Typography>
                        <Chip label={p.accreditor} size="small" sx={{ ml: 1 }} />
                      </Box>
                    )}
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                    {formatDate(p.start_date)} → {formatDate(p.end_date)}
                  </Typography>
                  <Typography variant="body2">
                    {p.start_date && p.end_date && calculateDuration(p.start_date, p.end_date)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>Edit Project</MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>Delete Project</MenuItem>
      </Menu>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{isEditMode ? "Edit Project" : "Add New Project"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField label="Project Name *" fullWidth value={name} onChange={(e) => setName(e.target.value)} size="small" />
            
            <FormControl fullWidth size="small">
              <InputLabel>Project Type *</InputLabel>
              <Select value={projectType} onChange={(e) => setProjectType(e.target.value)} label="Project Type *">
                <MenuItem value=""><em>Select Type</em></MenuItem>
                {PROJECT_TYPES.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField label="Description" multiline rows={3} fullWidth value={description} onChange={(e) => setDescription(e.target.value)} size="small" />
            
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField label="Start Date" type="date" InputLabelProps={{ shrink: true }} fullWidth value={startDate} onChange={(e) => setStartDate(e.target.value)} size="small" />
              <TextField label="End Date" type="date" InputLabelProps={{ shrink: true }} fullWidth value={endDate} onChange={(e) => setEndDate(e.target.value)} size="small" />
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Funder</InputLabel>
                <Select value={funder} onChange={(e) => setFunder(e.target.value)} label="Funder">
                  <MenuItem value=""><em>None</em></MenuItem>
                  {FUNDERS_LIST.map(f => (
                    <MenuItem key={f} value={f}>{f}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Accreditor</InputLabel>
                <Select value={accreditor} onChange={(e) => setAccreditor(e.target.value)} label="Accreditor">
                  <MenuItem value=""><em>None</em></MenuItem>
                  {ACCREDITORS_LIST.map(a => (
                    <MenuItem key={a} value={a}>{a}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Image Upload Section */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Project Image</Typography>
              <Input
                type="file"
                inputRef={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept="image/*"
              />
              <Button
                fullWidth
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                onClick={handleImageUploadClick}
                sx={{ mb: 2 }}
              >
                {projectImageFile ? 'Change Image' : 'Upload Image from Gallery'}
              </Button>
              
              {projectImagePreview && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="caption" display="block" gutterBottom>
                    Selected Image Preview:
                  </Typography>
                  <Box
                    component="img"
                    src={projectImagePreview}
                    alt="Preview"
                    sx={{
                      maxWidth: '100%',
                      maxHeight: 200,
                      objectFit: 'contain',
                      borderRadius: 1,
                      border: '1px solid #ddd'
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    {projectImageFile?.name}
                  </Typography>
                </Box>
              )}
            </Box>
            
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={status} onChange={(e) => setStatus(e.target.value)} label="Status">
                {STATUS_OPTIONS.map(s => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption">Duration:</Typography>
              <Typography variant="caption" fontWeight="bold">
                {startDate && endDate ? calculateDuration(startDate, endDate) : "Set dates to see duration"}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSaveProject} variant="contained" color="warning" disabled={saving}>
            {saving ? "Saving..." : isEditMode ? "Update Project" : "Create Project"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={openConfirmation}
        onClose={() => setOpenConfirmation(false)}
        aria-labelledby="confirmation-dialog-title"
      >
        <DialogTitle id="confirmation-dialog-title">
          Confirm Project {isEditMode ? "Update" : "Creation"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to {isEditMode ? "update" : "create"} this project?
            <br />
            <strong>Project Name:</strong> {name}
            <br />
            <strong>Project Type:</strong> {projectType}
            <br />
            <strong>Status:</strong> {status}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmation(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={confirmSaveProject} variant="contained" color="warning" autoFocus>
            Yes, {isEditMode ? "Update" : "Create"} Project
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;