import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Card, CardContent, CardActions, Button, Grid, Toolbar, IconButton, Menu, MenuItem, Modal, TextField, FormControl, InputLabel, Select, OutlinedInput, Checkbox, ListItemText 
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import BarChartIcon from "@mui/icons-material/BarChart";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import axios from "axios";

// List of fixed accreditors
const ACCREDITORS = ["Accreditor A", "Accreditor B", "Accreditor C", "Accreditor D"];

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    participants: "",
    accreditors: [],
  });

  // Fetch projects from backend
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get("http://localhost:5000/projects");
        setProjects(response.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProjects();
  }, []);

  // Menu for card actions
  const handleMenuClick = (event, project) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  const handleDeleteProject = async () => {
    try {
      await axios.delete(`http://localhost:5000/projects/${selectedProject.id}`);
      setProjects(projects.filter((p) => p.id !== selectedProject.id));
    } catch (err) {
      console.error(err);
    }
    handleMenuClose();
  };

  const handleCardClick = (project) => {
    setSelectedProject(project);
    setOpenModal(true);
  };

  const handleAddProjectChange = (e) => {
    setNewProject({ ...newProject, [e.target.name]: e.target.value });
  };

  const handleAddProjectSubmit = async () => {
    try {
      const response = await axios.post("http://localhost:5000/projects", newProject);
      setProjects([response.data, ...projects]);
      setNewProject({
        title: "",
        description: "",
        start_date: "",
        end_date: "",
        participants: "",
        accreditors: [],
      });
      setAddModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAccreditorsChange = (event) => {
    const {
      target: { value },
    } = event;
    setNewProject({ ...newProject, accreditors: typeof value === 'string' ? value.split(',') : value });
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Toolbar />

      {/* Header Titles */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "left", mb: 3 }}>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "#1976d2" }}>
             Projects and Beneficiaries Management System
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: "medium", color: "#555" }}>
           Monitored by: Hlayiseka Mkhabela
          </Typography>
        </Box>
      </Box>

      {/* Projects Overview Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#1976d2" }}>
          Projects Overview
        </Typography>
        <Box>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            sx={{ mr: 2, backgroundColor: "#FFD700", color: "#000", "&:hover": { backgroundColor: "#FFC107" } }}
            onClick={() => setAddModalOpen(true)}
          >
            Add Project
          </Button>
          <Button 
            variant="contained" 
            startIcon={<BarChartIcon />}
            sx={{ backgroundColor: "#FFD700", color: "#000", "&:hover": { backgroundColor: "#FFC107" } }}
          >
            View Analytics
          </Button>
        </Box>
      </Box>

      {/* Project Cards */}
      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid item xs={12} sm={6} md={4} key={project.id}>
            <Card 
              sx={{ 
                backgroundColor: "#fff", 
                color: "#000", 
                height: "100%", 
                display: "flex", 
                flexDirection: "column", 
                justifyContent: "space-between", 
                border: "2px solid #FFD700",
                cursor: "pointer",
              }}
              onClick={() => handleCardClick(project)}
            >
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1976d2" }}>
                  {project.title}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }} noWrap>
                  {project.description}
                </Typography>
                <Typography variant="body2">
                  <strong>Start:</strong> {project.start_date} <br />
                  <strong>End:</strong> {project.end_date} <br />
                  <strong>Participants:</strong> {project.participants} <br />
                  <strong>Accreditors:</strong> {project.accreditors ? project.accreditors.join(", ") : "-"}
                </Typography>
              </CardContent>
              <CardActions>
                <IconButton onClick={(e) => { e.stopPropagation(); handleMenuClick(e, project); }}>
                  <MoreVertIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Card Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleDeleteProject}>Delete</MenuItem>
      </Menu>

      {/* Project Details Modal */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 400, bgcolor: "#fff", p: 4, borderRadius: 2 }}>
          {selectedProject && (
            <>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                {selectedProject.title}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {selectedProject.description}
              </Typography>
              <Typography variant="body2">
                <strong>Start:</strong> {selectedProject.start_date} <br />
                <strong>End:</strong> {selectedProject.end_date} <br />
                <strong>Participants:</strong> {selectedProject.participants} <br />
                <strong>Accreditors:</strong> {selectedProject.accreditors ? selectedProject.accreditors.join(", ") : "-"}
              </Typography>
              <Button onClick={() => setOpenModal(false)} sx={{ mt: 2 }} variant="contained">Close</Button>
            </>
          )}
        </Box>
      </Modal>

      {/* Add Project Modal */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)}>
        <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 400, bgcolor: "#fff", p: 4, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>Add New Project</Typography>
          <TextField label="Title" name="title" fullWidth sx={{ mb: 2 }} value={newProject.title} onChange={handleAddProjectChange} />
          <TextField label="Description" name="description" fullWidth sx={{ mb: 2 }} value={newProject.description} onChange={handleAddProjectChange} />
          <TextField label="Start Date" name="start_date" type="date" fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} value={newProject.start_date} onChange={handleAddProjectChange} />
          <TextField label="End Date" name="end_date" type="date" fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} value={newProject.end_date} onChange={handleAddProjectChange} />
          <TextField label="Participants" name="participants" type="number" fullWidth sx={{ mb: 2 }} value={newProject.participants} onChange={handleAddProjectChange} />

          {/* Accreditors Multi-Select */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Accreditors</InputLabel>
            <Select
              multiple
              value={newProject.accreditors}
              onChange={handleAccreditorsChange}
              input={<OutlinedInput label="Accreditors" />}
              renderValue={(selected) => selected.join(", ")}
            >
              {ACCREDITORS.map((acc) => (
                <MenuItem key={acc} value={acc}>
                  <Checkbox checked={newProject.accreditors.indexOf(acc) > -1} />
                  <ListItemText primary={acc} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button variant="contained" onClick={handleAddProjectSubmit}>Add Project</Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default Dashboard;
