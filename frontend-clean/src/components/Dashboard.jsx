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
  ListItemText
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
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
      const res = await axios.get(API_URL);
      setProjects(res.data);

      const total = res.data.reduce(
        (sum, p) => sum + Number(p.participants || 0),
        0
      );
      setTotalBeneficiaries(total);
    } catch (err) {
      console.error("Failed to fetch projects", err);
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

    // Prepare data for backend
    const projectData = {
      title: title,
      description: description,
      start_date: startDate,
      end_date: endDate,
      participants: parseInt(participants),
      accreditors: selectedAccreditors
    };

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (isEditMode) {
        await axios.put(`${API_URL}/${editProjectId}`, projectData, config);
      } else {
        await axios.post(API_URL, projectData, config);
      }

      handleClose();
      fetchProjects();
    } catch (err) {
      console.error("Save failed", err);
      console.error("Error details:", err.response?.data || err.message);
      alert(`Failed to save project: ${err.response?.data?.error || err.message}`);
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
    setStartDate(p.start_date ? p.start_date.split('T')[0] : "");
    setEndDate(p.end_date ? p.end_date.split('T')[0] : "");
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
    if (!window.confirm("Are you sure you want to delete this project?")) {
      handleMenuClose();
      return;
    }

    try {
      await axios.delete(`${API_URL}/${selectedProject.id}`);
      fetchProjects();
    } catch {
      alert("Delete failed");
    }
    handleMenuClose();
  };

  // Handle accreditor selection
  const handleAccreditorChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedAccreditors(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  return (
    <Box sx={{ bgcolor: "white", minHeight: "80vh", p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h4" fontWeight="bold">
          JumpStart Your Career (NPO)
        </Typography>
        <Avatar src={companyLogo} sx={{ width: 100, height: 80 }} />
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography>Total Projects</Typography>
          <Typography fontWeight="bold">{projects.length}</Typography>
          <Typography>Total Beneficiaries</Typography>
          <Typography fontWeight="bold">{totalBeneficiaries}</Typography>
        </Box>

        <Button
          variant="contained"
          color="warning"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Add Project
        </Button>
      </Box>

      <Grid container spacing={3}>
        {projects.map((p) => (
          <Grid item xs={12} md={4} key={p.id}>
            <Card
              sx={{ 
                p: 2, 
                cursor: "pointer",
                position: "relative",
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease'
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

              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                {p.title}
              </Typography>

              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ mb: 2, height: 60, overflow: "hidden" }}
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
                        sx={{ fontSize: '0.7rem', height: 24 }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Divider sx={{ my: 1 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="caption" display="block" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography variant="caption" display="block">
                    {p.start_date} → {p.end_date}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" display="block" color="text.secondary">
                    Beneficiaries
                  </Typography>
                  <Typography variant="caption" display="block" fontWeight="bold">
                    {p.participants}
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {projects.length === 0 && (
        <Box sx={{ textAlign: "center", py: 10 }}>
          <Typography variant="h6" color="text.secondary">
            No projects yet. Click "Add Project" to get started.
          </Typography>
        </Box>
      )}

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>Edit</MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>Delete</MenuItem>
      </Menu>

      <Dialog open={openDialog} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{isEditMode ? "Edit Project" : "Add New Project"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField 
              label="Project Title *" 
              fullWidth
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              error={!title}
              helperText={!title ? "Required field" : ""}
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
              />
            </Box>
            
            <TextField 
              label="Duration" 
              fullWidth
              value={duration} 
              InputProps={{ readOnly: true }} 
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
            />
            
            <FormControl fullWidth>
              <InputLabel id="accreditors-label">Funders</InputLabel>
              <Select
                labelId="accreditors-label"
                id="accreditors-select"
                multiple
                value={selectedAccreditors}
                onChange={handleAccreditorChange}
                input={<OutlinedInput label="Accreditors" />}
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
                    <Checkbox checked={selectedAccreditors.indexOf(accreditor) > -1} />
                    <ListItemText primary={accreditor} />
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Select one or more accreditors (optional)
              </Typography>
            </FormControl>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSaveProject} 
            variant="contained" 
            color="warning"
            disabled={!title || !description || !startDate || !endDate || !participants}
          >
            {isEditMode ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;