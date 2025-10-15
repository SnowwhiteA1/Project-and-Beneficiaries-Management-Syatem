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
  const [duration, setDuration] = useState("");
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

  // Function to calculate duration between two dates
  const calculateDuration = (start, end) => {
    if (!start || !end) return "";
    
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    const diffTime = Math.abs(endDateObj - startDateObj);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      if (remainingMonths > 0) {
        return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
      }
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
  };

  // Update duration when start or end date changes
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
        // Update existing project
        await axios.put(`${API_URL}/${editProjectId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // Add new project
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
      setDuration("");
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
    <Box sx={{bgcolor: "white", minHeight: "80vh" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "black" ,mb:1}}>
          JumpStart Your Career (NPO)
        </Typography>
        <Avatar alt="Company Logo" src={companyLogo} sx={{ width: 100, height: 80 }} />
      </Box>

      <Divider sx={{ borderBottomWidth: 2, bgcolor: "black", mb: 3 }} />

      {/* Stats + Add Project Button */}
      <Box>
        <Box sx={{display:"table-header-group" , justifyContent:"left"  , px:{xs:2 ,sm:6 , md: 12}, py:4}}>
          <Typography variant= "subtitle1" sx={{ color :"black", fontSize :30  , px:{ md: 1}}}>Projects OverView</Typography>
          <Typography variant="h6" sx={{fontWeight:"bold"}}></Typography>
        </Box>
      </Box>
      
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap" , px:{ md: 3} }}>
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
          sx={{ bgcolor: "warning.main", color: "black", "&:hover": { bgcolor: "warning.dark"}, mb:1 }}
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Add Project
        </Button>
      </Box>

      {/* Projects Heading */}
      <Typography variant="h5" sx={{ textAlign: "center", fontWeight: "bold", color: "orange", mb: 2 }}>
        Projects and Beneficiary Mangement System
      </Typography>

      {/* Projects Cards */}
      <Grid container spacing={3}
      sx ={{justifyContent:"left"}}>
        {projects.length === 0 ? (
          <Grid item xs={12}>
            <Card sx={{ border: "2px solid black", p: 4, textAlign: "center", bgcolor: "white", borderRadius: 3 }}>
              <Typography variant="h6" sx={{ color: "black" }}>No projects found.</Typography>
            </Card>
          </Grid>
        ) : (
          projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id} sx={{ display: 'flex' , alignContent:"center"}}>
              <Card sx={{ 
                display: "flex", 
                flexDirection: "column", 
                border: "2px solid black", 
                bgcolor: "white", 
                color: "black", 
                borderRadius: 3, 
                position: "relative", 
                width: "100%",
                minHeight: 220
              }}>
                {/* Three dots menu and Image icon container */}
                <Box sx={{ position: "absolute", top: 0, right: 0, display: "flex", alignItems: "center" }}>
                  {/* Project image icon - positioned to the left of three dots */}
                  {project.image && (
                    <Avatar
                      src={`${IMAGE_URL}${project.image}`}
                      alt={project.project_name}
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        border: "1px solid #ddd",
                        mr: 1 
                      }}
                    />
                  )}
                  
                  {/* Three dots menu */}
                  <IconButton onClick={(e) => handleMenuClick(e, project)}>
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                <CardContent sx={{ 
                  flex: 1, 
                  pt: 4,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%"
                }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                    {project.project_name}
                  </Typography>
                  
                  <Typography sx={{ 
                    fontSize: 14, 
                    mb: 2,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    flex: 1,
                    minHeight: 60
                  }}>
                    <strong>Description:</strong> {project.description}
                  </Typography>
                  
                  <Box sx={{ mt: "auto" }}>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Start Date:</strong> {project.start_date}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>End Date:</strong> {project.end_date}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Duration:</strong> {calculateDuration(project.start_date, project.end_date)}
                    </Typography>
                    {project.participants !== undefined && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Beneficiaries:</strong> {project.participants}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>

              {/* Menu for the specific project */}
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl) && selectedProject?.id === project.id}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleEditProject}>Edit Project</MenuItem>
                <MenuItem onClick={handleDeleteProject}>Delete Project</MenuItem>
              </Menu>
            </Grid>
          ))
        )}
      </Grid>

      {/* Add/Edit Project Dialog */}
      <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditMode ? "Edit Project" : "Add New Project"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField 
            label="Project Name" 
            value={projectName} 
            onChange={(e) => setProjectName(e.target.value)} 
            fullWidth 
          />
          <TextField 
            label="Description" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            fullWidth 
            multiline 
            rows={3} 
          />
          <TextField 
            label="Start Date" 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            InputLabelProps={{ shrink: true }} 
            fullWidth 
          />
          <TextField 
            label="End Date" 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
            InputLabelProps={{ shrink: true }} 
            fullWidth 
          />
          <TextField 
            label="Duration" 
            value={duration} 
            InputProps={{ readOnly: true }}
            helperText="Automatically calculated from start and end dates"
            fullWidth 
          />
          <TextField 
            label="Total Participants" 
            type="number" 
            value={participants} 
            onChange={(e) => setParticipants(e.target.value)} 
            fullWidth 
          />
          <Button variant="outlined" component="label">
            {imageFile ? "Change Image" : "Upload Image"}
            <input type="file" hidden onChange={(e) => setImageFile(e.target.files[0])} />
          </Button>
          {imageFile && <Typography variant="caption">{imageFile.name}</Typography>}
          {isEditMode && selectedProject?.image && !imageFile && (
            <Typography variant="caption" sx={{ mt: 1 }}>
              Current image: {selectedProject.image}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleAddOrEditProject} variant="contained" sx={{ bgcolor: "warning.main", color: "black", "&:hover": { bgcolor: "warning.dark" } }}>
            {isEditMode ? "Update Project" : "Add Project"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;