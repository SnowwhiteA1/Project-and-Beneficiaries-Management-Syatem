import React, { useState } from "react";
import { 
  Box, Typography, Card, CardContent, CardActions, Button, Grid, Toolbar, IconButton, Menu, MenuItem, Modal, TextField 
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import BarChartIcon from "@mui/icons-material/BarChart";
import MoreVertIcon from "@mui/icons-material/MoreVert";

// Sample data (replace with backend data later)
const initialProjects = [
  {
    id: 1,
    title: "Expanded Public Works Programme",
    startDate: "10-07-2025",
    endDate: "31-03-2026",
    description: "Cleaning and beautification of Mbombela Stadium and Maintanance of its entry routes",
    participants: 72,
  },
  {
    id: 2,
    title: "BankSeta Internship",
    startDate: "02-05-2025",
    endDate: "30-04-2026",
    description: "3 years internship",
    participants: 27,
  },
  {
    id: 3,
    title: "TETA Graduate",
    startDate: "06-01-2025",
    endDate: "31-12-2025",
    description: "Unemployed Internship Graduate",
    participants: 10,
  },
];

const Dashboard = () => {
  const [projects, setProjects] = useState(initialProjects);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    participants: "",
  });

  // Menu for card actions
  const handleMenuClick = (event, project) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  const handleDeleteProject = () => {
    setProjects(projects.filter((p) => p.id !== selectedProject.id));
    handleMenuClose();
  };

  const handleCardClick = (project) => {
    setSelectedProject(project);
    setOpenModal(true);
  };

  const handleAddProjectChange = (e) => {
    setNewProject({ ...newProject, [e.target.name]: e.target.value });
  };

  const handleAddProjectSubmit = () => {
    const id = projects.length ? projects[projects.length - 1].id + 1 : 1;
    setProjects([...projects, { ...newProject, id }]);
    setNewProject({ title: "", description: "", startDate: "", endDate: "", participants: "" });
    setAddModalOpen(false);
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Toolbar />

      {/* Header with logo and titles */}
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

      {/* Projects Overview */}
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
                  <strong>Start:</strong> {project.startDate} <br />
                  <strong>End:</strong> {project.endDate} <br />
                  <strong>Participants:</strong> {project.participants}
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
        {/* Add edit functionality here later */}
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
                <strong>Start:</strong> {selectedProject.startDate} <br />
                <strong>End:</strong> {selectedProject.endDate} <br />
                <strong>Participants:</strong> {selectedProject.participants}
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
          <TextField label="Start Date" name="startDate" type="date" fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} value={newProject.startDate} onChange={handleAddProjectChange} />
          <TextField label="End Date" name="endDate" type="date" fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} value={newProject.endDate} onChange={handleAddProjectChange} />
          <TextField label="Participants" name="participants" type="number" fullWidth sx={{ mb: 2 }} value={newProject.participants} onChange={handleAddProjectChange} />
          <Button variant="contained" onClick={handleAddProjectSubmit}>Add Project</Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default Dashboard;
