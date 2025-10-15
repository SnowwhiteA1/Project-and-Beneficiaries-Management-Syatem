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
  MenuItem
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import axios from "axios";

const companyLogo = "/logo.jpeg";

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [totalBeneficiaries, setTotalBeneficiaries] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [participants, setParticipants] = useState("");
  const [duration, setDuration] = useState("");
  const [editProjectId, setEditProjectId] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  const API_URL = "http://127.0.0.1:5050/projects";
  const IMAGE_URL = "http://127.0.0.1:5050/uploads/";

  useEffect(() => {
    fetchProjects();
  }, []);

  const calculateDuration = (start, end) => {
    if (!start || !end) return "";
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    const diffTime = Math.abs(endDateObj - startDateObj);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months !== 1 ? "s" : ""}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      return remainingMonths > 0
        ? `${years} year${years !== 1 ? "s" : ""} ${remainingMonths} month${
            remainingMonths !== 1 ? "s" : ""
          }`
        : `${years} year${years !== 1 ? "s" : ""}`;
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      setDuration(calculateDuration(startDate, endDate));
    } else {
      setDuration("");
    }
  }, [startDate, endDate]);

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
    setDuration("");
    setImageFile(null);
    setOpenDialog(true);
  };
  const handleClose = () => setOpenDialog(false);

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

      handleClose();
      fetchProjects();
    } catch (err) {
      console.error("Error saving project:", err);
      alert("Failed to save project. Check backend connection.");
    }
  };

  const handleMenuClick = (event, project) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  const handleEditProject = () => {
    if (!selectedProject) return;
    setIsEditMode(true);
    setEditProjectId(selectedProject.id);
    setProjectName(selectedProject.project_name || "");
    setDescription(selectedProject.description || "");
    setStartDate(selectedProject.start_date || "");
    setEndDate(selectedProject.end_date || "");
    setParticipants(selectedProject.participants || "");
    setDuration(calculateDuration(selectedProject.start_date, selectedProject.end_date));
    setImageFile(null);
    setOpenDialog(true);
    handleMenuClose();
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;
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
    <Box sx={{ bgcolor: "white", minHeight: "80vh", p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "black" }}>
          JumpStart Your Career (NPO)
        </Typography>
        <Avatar alt="Company Logo" src={companyLogo} sx={{ width: 90, height: 70 }} />
      </Box>

      <Divider sx={{ borderBottomWidth: 2, bgcolor: "black", mb: 3 }} />
      <Box><Box>
        <Typography sx={{fontSize:25, mb : 2}}>
          Project OverView
        </Typography>
        
        </Box></Box>

      {/* Stats Section */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap" }}>
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

        <Button
          variant="contained"
          sx={{ bgcolor: "warning.main", color: "black", "&:hover": { bgcolor: "warning.dark" } }}
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Add Project
        </Button>
      </Box>

      {/* Title */}
      <Typography variant="h5" sx={{ textAlign: "center", fontWeight: "bold", color: "orange", mb: 3 }}>
        Projects and Beneficiary Management System
      </Typography>

      {/* Project Cards */}
      <Grid container spacing={3} justifyContent="center">
        {projects.length === 0 ? (
          <Grid item xs={12}>
            <Card sx={{ border: "2px solid black", p: 4, textAlign: "center", borderRadius: 3 }}>
              <Typography variant="h6" sx={{ color: "black" }}>No projects found.</Typography>
            </Card>
          </Grid>
        ) : (
          projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id} sx={{ display: "flex", justifyContent: "center" }}>
              <Card
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  border: "2px solid #000",
                  borderRadius: 3,
                  bgcolor: "white",
                  color: "black",
                  width: "100%",
                  maxWidth: 360,
                  height: 380,
                  boxShadow: 3,
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
                  position: "relative",
                }}
              >
                {/* Top-right menu */}
                <Box sx={{ position: "absolute", top: 8, right: 8 }}>
                  <IconButton onClick={(e) => handleMenuClick(e, project)} size="small">
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                {/* Content */}
                <CardContent sx={{ flex: 1, overflow: "hidden" }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                    {project.project_name}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: 14,
                      mb: 2,
                      display: "-webkit-box",
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      minHeight: "80px",
                    }}
                  >
                    <strong>Description:</strong> {project.description}
                  </Typography>

                  <Box sx={{ mt: "auto" }}>
                    <Typography variant="body2"><strong>Start:</strong> {project.start_date}</Typography>
                    <Typography variant="body2"><strong>End:</strong> {project.end_date}</Typography>
                    <Typography variant="body2"><strong>Duration:</strong> {calculateDuration(project.start_date, project.end_date)}</Typography>
                    <Typography variant="body2"><strong>Beneficiaries:</strong> {project.participants}</Typography>
                  </Box>
                </CardContent>
              </Card>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl) && selectedProject?.id === project.id}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleEditProject}>Edit</MenuItem>
                <MenuItem onClick={handleDeleteProject}>Delete</MenuItem>
              </Menu>
            </Grid>
          ))
        )}
      </Grid>

      {/* Add/Edit Project Dialog */}
      <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditMode ? "Edit Project" : "Add New Project"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField label="Project Name" value={projectName} onChange={(e) => setProjectName(e.target.value)} fullWidth />
          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={3} />
          <TextField label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
          <TextField label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
          <TextField label="Duration" value={duration} InputProps={{ readOnly: true }} helperText="Automatically calculated" fullWidth />
          <TextField label="Total Participants" type="number" value={participants} onChange={(e) => setParticipants(e.target.value)} fullWidth />
          <Button variant="outlined" component="label">
            {imageFile ? "Change Image" : "Upload Image"}
            <input type="file" hidden onChange={(e) => setImageFile(e.target.files[0])} />
          </Button>
          {imageFile && <Typography variant="caption">{imageFile.name}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleAddOrEditProject} variant="contained" sx={{ bgcolor: "warning.main", color: "black" }}>
            {isEditMode ? "Update Project" : "Add Project"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
