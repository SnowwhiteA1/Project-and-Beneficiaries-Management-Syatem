import React, { useState, useEffect } from "react";
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
  OutlinedInput,
  Checkbox,
  ListItemText,
  CircularProgress,
  Alert
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PeopleIcon from "@mui/icons-material/People";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const companyLogo = "/logo.jpeg";

const API_BASE = "http://127.0.0.1:5050";
const API_URL = `${API_BASE}/api/projects`;

// List of predefined accreditors
const ACCREDITORS_LIST = [
  "BankSeta",
  "Fasset",
  "MICSETA",
  "JumpStart",
  "Social Development"
];

const Dashboard = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [totalBeneficiaries, setTotalBeneficiaries] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [participants, setParticipants] = useState("");
  const [selectedAccreditors, setSelectedAccreditors] = useState([]);
  const [duration, setDuration] = useState("");
  const [editProjectId, setEditProjectId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

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

  useEffect(() => {
    setDuration(calculateDuration(startDate, endDate));
  }, [startDate, endDate]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("📋 Fetching projects...");
      
      const res = await axios.get(API_URL);
      console.log("✅ Projects data:", res.data);
      setProjects(res.data);

      const total = res.data.reduce(
        (sum, p) => sum + Number(p.participants || 0),
        0
      );
      setTotalBeneficiaries(total);
    } catch (err) {
      console.error("❌ Failed to fetch projects:", err);
      setError(err.response?.data?.error || "Failed to load projects. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setParticipants("");
    setSelectedAccreditors([]);
    setDuration("");
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

  const handleSaveProject = async () => {
    // Validate required fields
    if (!title || !description || !startDate || !endDate || !participants) {
      alert("Please fill in all required fields (*)");
      return;
    }

    // Prepare data for backend - EXACTLY matching backend expectations
    const projectData = {
      title: title.trim(),
      description: description.trim(),
      start_date: startDate,
      end_date: endDate,
      participants: parseInt(participants),
      accreditors: selectedAccreditors
    };

    console.log("📝 Saving project:", projectData);

    try {
      setSaving(true);
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (isEditMode) {
        console.log(`🔄 Updating project ${editProjectId}`);
        await axios.put(`${API_URL}/${editProjectId}`, projectData, config);
      } else {
        console.log("➕ Creating new project");
        await axios.post(API_URL, projectData, config);
      }

      handleClose();
      fetchProjects();
      alert(`Project ${isEditMode ? 'updated' : 'created'} successfully!`);
    } catch (err) {
      console.error("❌ Save failed:", err);
      console.error("Error details:", err.response?.data || err.message);
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
    setTitle(p.title || "");
    setDescription(p.description || "");
    setStartDate(p.start_date || "");
    setEndDate(p.end_date || "");
    setParticipants(p.participants || "");
    
    // Set selected accreditors
    if (p.accreditors && Array.isArray(p.accreditors)) {
      setSelectedAccreditors(p.accreditors);
    } else {
      setSelectedAccreditors([]);
    }
    
    setDuration(calculateDuration(p.start_date, p.end_date));
    setOpenDialog(true);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${selectedProject.title}"?`)) {
      handleMenuClose();
      return;
    }

    try {
      console.log(`🗑️ Deleting project ${selectedProject.id}`);
      await axios.delete(`${API_URL}/${selectedProject.id}`);
      alert("Project deleted successfully!");
      fetchProjects();
    } catch (err) {
      console.error("❌ Delete failed:", err);
      alert(`Delete failed: ${err.response?.data?.error || err.message}`);
    }
    handleMenuClose();
  };

  // Handle accreditor selection
  const handleAccreditorChange = (event) => {
    const { value } = event.target;
    setSelectedAccreditors(typeof value === 'string' ? value.split(',') : value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "white", minHeight: "80vh", p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            JumpStart Your Career (NPO)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Project Management Dashboard
          </Typography>
        </Box>
        <Avatar src={companyLogo} sx={{ width: 100, height: 80, borderRadius: 2 }} />
      </Box>

      <Divider sx={{ my: 3 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Section */}
      <Box sx={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        mb: 4,
        p: 3,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 1
      }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h3" fontWeight="bold" color="primary">
            {projects.length}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Total Projects
          </Typography>
        </Box>
        
        <Divider orientation="vertical" flexItem />
        
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h3" fontWeight="bold" color="secondary">
            {totalBeneficiaries}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Total Beneficiaries
          </Typography>
        </Box>
        
        <Box>
          <Button
            variant="contained"
            color="warning"
            startIcon={<AddIcon />}
            onClick={handleOpen}
            size="large"
          >
            Add New Project
          </Button>
        </Box>
      </Box>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 10, bgcolor: 'background.paper', borderRadius: 2 }}>
          <PeopleIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No projects found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Get started by creating your first project
          </Typography>
          <Button
            variant="contained"
            color="warning"
            startIcon={<AddIcon />}
            onClick={handleOpen}
          >
            Create First Project
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {projects.map((p) => (
            <Grid item xs={12} sm={6} md={4} key={p.id}>
              <Card
                sx={{ 
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  position: "relative",
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 8
                  }
                }}
                onClick={() => navigate(`/beneficiaries/${p.id}`)}
              >
                <IconButton
                  sx={{ position: "absolute", right: 8, top: 8, zIndex: 1 }}
                  onClick={(e) => handleMenuClick(e, p)}
                >
                  <MoreVertIcon />
                </IconButton>

                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, color: "primary.main" }}>
                    {p.title}
                  </Typography>

                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      mb: 2, 
                      height: 60, 
                      overflow: "hidden",
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {p.description}
                  </Typography>

                  {p.accreditors && p.accreditors.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                        Accreditors:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {p.accreditors.map((acc, index) => (
                          <Chip 
                            key={index}
                            label={acc}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                        <CalendarTodayIcon sx={{ fontSize: 16, mr: 0.5, color: "text.secondary" }} />
                        <Typography variant="caption" color="text.secondary">
                          Duration
                        </Typography>
                      </Box>
                      <Typography variant="body2">
                        {formatDate(p.start_date)} → {formatDate(p.end_date)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ textAlign: "right" }}>
                      <Box sx={{ display: "flex", alignItems: "center", mb: 0.5, justifyContent: "flex-end" }}>
                        <PeopleIcon sx={{ fontSize: 16, mr: 0.5, color: "text.secondary" }} />
                        <Typography variant="caption" color="text.secondary">
                          Beneficiaries
                        </Typography>
                      </Box>
                      <Typography variant="h6" fontWeight="bold" color="secondary.main">
                        {p.participants}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Project Menu */}
      <Menu 
        anchorEl={anchorEl} 
        open={Boolean(anchorEl)} 
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemText primary="Edit Project" />
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
          <ListItemText primary="Delete Project" />
        </MenuItem>
      </Menu>

      {/* Add/Edit Project Dialog */}
      <Dialog open={openDialog} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            {isEditMode ? "Edit Project" : "Add New Project"}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 2 }}>
            <TextField 
              label="Project Title *" 
              fullWidth
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              error={!title}
              helperText={!title ? "Required field" : ""}
              size="small"
            />
            
            <TextField 
              label="Description *" 
              multiline 
              rows={3} 
              fullWidth
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              error={!description}
              helperText={!description ? "Required field" : ""}
              size="small"
            />
            
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField 
                type="date" 
                label="Start Date *" 
                fullWidth
                InputLabelProps={{ shrink: true }} 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                error={!startDate}
                helperText={!startDate ? "Required field" : ""}
                size="small"
              />
              
              <TextField 
                type="date" 
                label="End Date *" 
                fullWidth
                InputLabelProps={{ shrink: true }} 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                error={!endDate}
                helperText={!endDate ? "Required field" : ""}
                size="small"
              />
            </Box>
            
            <TextField 
              label="Duration" 
              fullWidth
              value={duration} 
              InputProps={{ 
                readOnly: true,
                startAdornment: <CalendarTodayIcon sx={{ mr: 1, color: "text.secondary" }} />
              }} 
              size="small"
            />
            
            <TextField 
              label="Number of Participants *" 
              type="number" 
              fullWidth
              value={participants} 
              onChange={(e) => setParticipants(e.target.value)} 
              inputProps={{ min: 0 }}
              error={!participants}
              helperText={!participants ? "Required field" : ""}
              size="small"
            />
            
            <FormControl fullWidth size="small">
              <InputLabel id="accreditors-label">Accreditors / Funders</InputLabel>
              <Select
                labelId="accreditors-label"
                multiple
                value={selectedAccreditors}
                onChange={handleAccreditorChange}
                input={<OutlinedInput label="Accreditors / Funders" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                {ACCREDITORS_LIST.map((accreditor) => (
                  <MenuItem key={accreditor} value={accreditor}>
                    <Checkbox checked={selectedAccreditors.indexOf(accreditor) > -1} size="small" />
                    <ListItemText primary={accreditor} />
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Select one or more accreditors/funders (optional)
              </Typography>
            </FormControl>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button onClick={handleClose} color="inherit" disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveProject} 
            variant="contained" 
            color="warning"
            disabled={!title || !description || !startDate || !endDate || !participants || saving}
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {saving ? "Saving..." : (isEditMode ? "Update Project" : "Create Project")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;