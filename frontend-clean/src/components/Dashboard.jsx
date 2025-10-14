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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import axios from "axios";

const companyLogo = "/logo192.png";
const placeholderImage = "/placeholder.png";

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [totalBeneficiaries, setTotalBeneficiaries] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);

  // Form fields
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [participants, setParticipants] = useState("");

  const API_URL = "http://127.0.0.1:5050/projects";

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

  // Open and close dialog
  const handleOpen = () => setOpenDialog(true);
  const handleClose = () => setOpenDialog(false);

  const handleAddProject = async () => {
    if (!projectName || !description || !startDate || !endDate || !participants) {
      alert("Please fill all fields");
      return;
    }

    try {
      await axios.post(API_URL, {
        project_name: projectName,
        description,
        start_date: startDate,
        end_date: endDate,
        participants: parseInt(participants),
      });

      // Clear form
      setProjectName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setParticipants("");

      // Close dialog and refresh projects
      handleClose();
      fetchProjects();
    } catch (err) {
      console.error("Error adding project:", err);
      alert("Failed to add project. Check backend connection.");
    }
  };

  return (
    <Box sx={{ p: 4, bgcolor: "white", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "black" }}>
          JumpStart NPO
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
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "yellow" }}>{projects.length}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ color: "black" }}>Total Beneficiaries</Typography>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "yellow" }}>{totalBeneficiaries}</Typography>
          </Box>
        </Box>

        {/* Add Project Button */}
        <Button
          variant="contained"
          sx={{ bgcolor: "yellow", color: "black", "&:hover": { bgcolor: "#FFD700" } }}
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Add Project
        </Button>
      </Box>

      {/* Projects Heading */}
      <Typography variant="h5" sx={{ textAlign: "center", fontWeight: "bold", color: "black", mb: 3 }}>
        Projects and Beneficiaries
      </Typography>

      {/* Projects Cards */}
      <Grid container spacing={3}>
        {projects.length === 0 ? (
          <Grid item xs={12}>
            <Card sx={{ border: "2px solid black", p: 4, textAlign: "center", bgcolor: "white" }}>
              <Typography variant="h6" sx={{ color: "black" }}>No projects found.</Typography>
            </Card>
          </Grid>
        ) : (
          projects.map((project) => (
            <Grid item xs={12} md={6} lg={4} key={project.id}>
              <Card sx={{ display: "flex", border: "2px solid black", bgcolor: "white", color: "black", height: 180 }}>
                <CardContent sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>{project.project_name}</Typography>
                  <Typography sx={{ fontSize: 14, mt: 1 }}>{project.description}</Typography>
                  <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                    {project.start_date} - {project.end_date}
                  </Typography>
                  {project.participants !== undefined && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Beneficiaries: {project.participants}
                    </Typography>
                  )}
                </CardContent>
                <CardMedia
                  component="img"
                  sx={{ width: 150 }}
                  image={project.image || placeholderImage}
                  alt={project.project_name || "Project Image"}
                />
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Add Project Dialog */}
      <Dialog open={openDialog} onClose={handleClose}>
        <DialogTitle>Add New Project</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField label="Project Name" value={projectName} onChange={(e) => setProjectName(e.target.value)} fullWidth />
          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={3} />
          <TextField label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField label="Total Participants" type="number" value={participants} onChange={(e) => setParticipants(e.target.value)} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleAddProject} variant="contained" sx={{ bgcolor: "yellow", color: "black", "&:hover": { bgcolor: "#FFD700" } }}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
