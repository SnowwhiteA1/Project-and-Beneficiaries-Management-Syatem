import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Menu,
  MenuItem,
  IconButton,
  Modal,
  TextField,
  Toolbar,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AddIcon from "@mui/icons-material/Add";

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    project_name: "",
    description: "",
    start_date: "",
    end_date: "",
    participants: "",
  });

  const open = Boolean(anchorEl);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("http://localhost:5050/projects");
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const handleMenuClick = (event, project) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditProject = () => {
    handleMenuClose();
    setEditMode(true);
    setFormData(selectedProject);
    setOpenModal(true);
  };

  const handleDeleteProject = async () => {
    handleMenuClose();
    if (window.confirm("Are you sure you want to delete this project?")) {
      await fetch(`http://localhost:5050/projects/${selectedProject.id}`, {
        method: "DELETE",
      });
      fetchProjects();
    }
  };

  const handleOpenModal = () => {
    setFormData({
      project_name: "",
      description: "",
      start_date: "",
      end_date: "",
      participants: "",
    });
    setEditMode(false);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    const url = editMode
      ? `http://localhost:5050/projects/${selectedProject.id}`
      : "http://localhost:5050/projects";

    const method = editMode ? "PUT" : "POST";

    try {
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      // ✅ Refresh and close modal after successful submit
      fetchProjects();
      setOpenModal(false);
      setFormData({
        project_name: "",
        description: "",
        start_date: "",
        end_date: "",
        participants: "",
      });
    } catch (error) {
      console.error("Error submitting project:", error);
    }
  };

  // ✅ Calculate duration
  const getDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `${diff} days` : "N/A";
  };

  // ✅ Total participants count (optional)
  const totalParticipants = projects.reduce(
    (sum, project) => sum + (Number(project.participants) || 0),
    0
  );

  return (
    <Box sx={{ p: 3, backgroundColor: "#fff", minHeight: "100vh" }}>
      {/* Header */}
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          borderBottom: "4px solid black",
          mb: 3,
        }}
      >
        <Typography variant="h5" fontWeight="bold" color="black">
          JumpStart NPO
        </Typography>
        <img
          src="/images/logo.png"
          alt="Logo"
          style={{ height: 50, objectFit: "contain" }}
        />
      </Toolbar>

      {/* Top Section: Stats + Button */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h6" color="black">
            Total Projects: {projects.length}
          </Typography>
          <Typography variant="h6" color="black">
            Total Beneficiaries: {totalParticipants}
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="warning"
          startIcon={<AddIcon />}
          onClick={handleOpenModal}
          sx={{
            textTransform: "none",
            borderRadius: "12px",
            px: 3,
          }}
        >
          Add Project
        </Button>
      </Box>

      {/* Projects Grid */}
      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid item xs={12} sm={6} md={4} key={project.id}>
            <Card
              sx={{
                height: "100%",
                border: "1px solid black",
                borderRadius: "16px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                backgroundColor: "#fff",
                overflow: "visible",
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="h6" fontWeight="bold" color="black">
                    {project.project_name}
                  </Typography>
                  <IconButton
                    onClick={(e) => handleMenuClick(e, project)}
                    size="small"
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 1,
                    mb: 2,
                    wordWrap: "break-word",
                    overflow: "visible",
                  }}
                >
                  <strong>Description:</strong> {project.description}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  <strong>Start Date:</strong> {project.start_date}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>End Date:</strong> {project.end_date}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Duration:</strong>{" "}
                  {getDuration(project.start_date, project.end_date)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Participants:</strong> {project.participants || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Edit/Delete Menu */}
      <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
        <MenuItem onClick={handleEditProject}>Edit</MenuItem>
        <MenuItem onClick={handleDeleteProject}>Delete</MenuItem>
      </Menu>

      {/* Add/Edit Modal */}
    <Modal open={openModal} onClose={handleCloseModal}>
  <Box
    sx={{
      width: 400,
      bgcolor: "background.paper",
      mx: "auto",
      mt: 10,
      borderRadius: "16px",
      boxShadow: 3,
      display: "flex",
      flexDirection: "column",
      maxHeight: "80vh", // 👈 limit height to viewport
      overflowY: "auto", // 👈 enable scrolling if content too tall
      p: 3,
    }}
  >
    <Typography variant="h6" mb={2}>
      {editMode ? "Edit Project" : "Add Project"}
    </Typography>

    <TextField
      label="Project Name"
      name="project_name"
      fullWidth
      margin="normal"
      value={formData.project_name}
      onChange={handleFormChange}
    />
    <TextField
      label="Description"
      name="description"
      fullWidth
      multiline
      rows={3}
      margin="normal"
      value={formData.description}
      onChange={handleFormChange}
    />
    <TextField
      label="Start Date"
      type="date"
      name="start_date"
      fullWidth
      margin="normal"
      InputLabelProps={{ shrink: true }}
      value={formData.start_date}
      onChange={handleFormChange}
    />
    <TextField
      label="End Date"
      type="date"
      name="end_date"
      fullWidth
      margin="normal"
      InputLabelProps={{ shrink: true }}
      value={formData.end_date}
      onChange={handleFormChange}
    />
    <TextField
      label="Total Participants"
      name="participants"
      fullWidth
      margin="normal"
      value={formData.participants}
      onChange={handleFormChange}
    />

    {/* ✅ Button always visible */}
    <Box
      sx={{
        mt: 3,
        position: "sticky",
        bottom: 0,
        bgcolor: "background.paper",
        py: 1,
      }}
    >
      <Button
        fullWidth
        variant="contained"
        color="warning"
        onClick={handleSubmit}
        sx={{
          textTransform: "none",
          fontWeight: "bold",
          borderRadius: "10px",
          "&:hover": { bgcolor: "warning.dark" },
        }}
      >
        {editMode ? "Save Changes" : "Add Project"}
      </Button>
    </Box>
  </Box>
</Modal>

    </Box>
  );
};

export default Dashboard;
