import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
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
  MenuItem
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import axios from "axios";

const companyLogo = "/logo.jpeg";
const placeholderImage = "/placeholder.png";

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [totalBeneficiaries, setTotalBeneficiaries] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form fields
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [participants, setParticipants] = useState("");
  const [editProjectId, setEditProjectId] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // Three dots menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  const API_URL = "http://127.0.0.1:5050/projects";
  const IMAGE_URL = "http://127.0.0.1:5050/uploads/";

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(API_URL);
      setProjects(res.data);

      const total = res.data.reduce(
        (sum, project) => sum + (project.participants || 0),
        0
      );
      setTotalBeneficiaries(total);
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };

  const handleOpen = () => {
    setIsEditMode(false);
    setProjectName("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setParticipants("");
    setImageFile(null);
    setOpenDialog(true);
  };
  const handleClose = () => setOpenDialog(false);

  // Add or Edit Project
  const handleAddOrEditProject = async () => {
    if (!projectName || !description || !startDate || !endDate || !participants) {
      alert("Please fill all fields");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("project_name", projectName);
      formData.append("description", description);
      formData.append("start_date", startDate);
      formData.append("end_date", endDate);
      formData.append("participants", participants);
      if (imageFile) formData.append("image", imageFile);

      if (isEditMode) {
        await axios.put(`${API_URL}/${editProjectId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post(API_URL, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      // Clear form and refresh
      setProjectName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setParticipants("");
      setImageFile(null);
      setEditProjectId(null);
      setIsEditMode(false);
      handleClose();
      fetchProjects();
    } catch (err) {
      console.error("Error saving project:", err);
      alert("Failed to save project. Check backend connection.");
    }
  };

  // Three dots menu functions
  const handleMenuClick = (event, project) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  const handleEditProject = () => {
    setIsEditMode(true);
    setEditProjectId(selectedProject.id);
    setProjectName(selectedProject.project_name);
    setDescription(selectedProject.description);
    setStartDate(selectedProject.start_date);
    setEndDate(selectedProject.end_date);
    setParticipants(selectedProject.participants || "");
    setImageFile(null);
    handleOpen();
    handleMenuClose();
  };

  const handleDeleteProject = async () => {
    try {
      await axios.delete(`${API_URL}/${selectedProject.id}`);
      fetchProjects();
    } catch (err) {
      console.error("Error deleting project:", err);
      alert("Failed to delete project.");
    }
    handleMenuClose();
  };

  return (
    <Box sx={{ p: 4, bgcolor: "white", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "black" }}>
          JumpStart Your Career (NPO)
        </Typography>
        <Avatar alt="Company Logo" src={companyLogo} sx={{ width: 80, height: 80 }} />
      </Box>

      <Divider sx={{ borderBottomWidth: 2, bgcolor: "black", mb: 3 }} />

      {/* Stats + Add Project Button */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap" }}>
        {/* Stats */}
        <Box sx={{ display: "flex", gap: 5 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: "black" }}>Total Projects</Typography>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "warning.main" }}>{projects.length}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ color: "black" }}>Total Beneficiaries</Typography>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "warning.main" }}>{totalBeneficiaries}</Typography>
          </Box>
        </Box>

        {/* Add Project Button */}
        <Button
          variant="contained"
          sx={{ bgcolor: "warning.main", color: "black", "&:hover": { bgcolor: "warning.dark" } }}
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Add Project
        </Button>
      </Box>

      {/* Projects Heading */}
      <Typography variant="h5" sx={{ textAlign: "center", fontWeight: "bold", color: "orange", mb: 3 }}>
        Projects and Beneficiaries Management System
      </Typography>

      {/* Projects Cards */}
      <Grid container spacing={3}>
        {projects.length === 0 ? (
          <Grid item xs={12}>
            <Card sx={{ border: "2px solid black", p: 4, textAlign: "center", bgcolor: "white", borderRadius: 3 }}>
              <Typography variant="h6" sx={{ color: "black" }}>No projects found.</Typography>
            </Card>
          </Grid>
        ) : (
          projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Card sx={{ display: "flex", flexDirection: "column", border: "2px solid black", bgcolor: "white", color: "black", borderRadius: 3, position: "relative", minHeight: 220 }}>
                {/* Three dots menu */}
                <IconButton
                  sx={{ position: "absolute", top: 0, right: 0 }}
                  onClick={(e) => handleMenuClick(e, project)}
                >
                  <MoreVertIcon />
                </IconButton>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={handleEditProject}>Edit Project</MenuItem>
                  <MenuItem onClick={handleDeleteProject}>Delete Project</MenuItem>
                </Menu>

                <CardContent sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>{project.project_name}</Typography>
                  <Typography sx={{ fontSize: 14, mt: 1, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    <strong>Description:</strong> {project.description}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Dates:</strong> {project.start_date} - {project.end_date}
                  </Typography>
                  {project.participants !== undefined && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Beneficiaries:</strong> {project.participants}
                    </Typography>
                  )}
                </CardContent>

                {project.image && (
                  <CardMedia
                    component="img"
                    sx={{ width: 150, height: 100, objectFit: "cover", alignSelf: "flex-end", m: 1 }}
                    image={`${IMAGE_URL}${project.image}`}
                    alt={project.project_name}
                  />
                )}
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Add/Edit Project Dialog */}
      <Dialog open={openDialog} onClose={handleClose}>
        <DialogTitle>{isEditMode ? "Edit Project" : "Add New Project"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField label="Project Name" value={projectName} onChange={(e) => setProjectName(e.target.value)} fullWidth />
          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={3} />
          <TextField label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField label="Total Participants" type="number" value={participants} onChange={(e) => setParticipants(e.target.value)} fullWidth />
          <Button variant="outlined" component="label">
            {imageFile ? "Change Image" : "Upload Image"}
            <input type="file" hidden onChange={(e) => setImageFile(e.target.files[0])} />
          </Button>
          {imageFile && <Typography variant="caption">{imageFile.name}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleAddOrEditProject} variant="contained" sx={{ bgcolor: "warning.main", color: "black", "&:hover": { bgcolor: "warning.dark" } }}>
            {isEditMode ? "Save Changes" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
