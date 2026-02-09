import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  Paper,
  Avatar,
  Stack,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
  Chip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import HomeIcon from "@mui/icons-material/Home";
import WorkIcon from "@mui/icons-material/Work";
import SchoolIcon from "@mui/icons-material/School";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import BadgeIcon from "@mui/icons-material/Badge";
import TranslateIcon from "@mui/icons-material/Translate";
import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew";
import PublicIcon from "@mui/icons-material/Public";
import BusinessIcon from "@mui/icons-material/Business";
import DescriptionIcon from "@mui/icons-material/Description";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PaymentIcon from "@mui/icons-material/Payment";
import NotesIcon from "@mui/icons-material/Notes";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = "http://localhost:5050";

// Helper functions that can be used anywhere
const formatDate = (dateString) => {
  if (!dateString) return "Not specified";
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

const formatCurrency = (amount) => {
  if (!amount || isNaN(amount)) return "R 0.00";
  return `R ${parseFloat(amount).toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const hasValue = (value) => {
  return value !== null && value !== undefined && value !== "";
};

// Memoize the TabPanel component to prevent unnecessary re-renders
const TabPanel = React.memo(({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`beneficiary-tabpanel-${index}`}
      aria-labelledby={`beneficiary-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
});

// Memoize the BeneficiaryDetailView component
const BeneficiaryDetailView = React.memo(({ beneficiary, open, onClose, onEditClick }) => {
  if (!beneficiary) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="md"
      maxHeight="90vh"
    >
      <DialogTitle sx={{ 
        borderBottom: 1, 
        borderColor: 'divider', 
        pb: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box>
          <Typography variant="h5" component="div" fontWeight="bold">
            {beneficiary.first_name} {beneficiary.last_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ID: {beneficiary.id_number || "Not specified"}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* Personal Information */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="bold">
                Personal Information
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <ListItem disablePadding>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <BadgeIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="ID Number" 
                    secondary={beneficiary.id_number || "Not specified"}
                  />
                </ListItem>
              </Grid>
              <Grid item xs={12} sm={6}>
                <ListItem disablePadding>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CalendarTodayIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Date of Birth" 
                    secondary={formatDate(beneficiary.date_of_birth)}
                  />
                </ListItem>
              </Grid>
              <Grid item xs={12} sm={6}>
                <ListItem disablePadding>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <PersonIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Gender" 
                    secondary={beneficiary.gender || "Not specified"}
                  />
                </ListItem>
              </Grid>
              <Grid item xs={12} sm={6}>
                <ListItem disablePadding>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <PublicIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Race" 
                    secondary={beneficiary.race || "Not specified"}
                  />
                </ListItem>
              </Grid>
              <Grid item xs={12} sm={6}>
                <ListItem disablePadding>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Typography sx={{ fontSize: '14px', minWidth: 36 }}>Age</Typography>
                  </ListItemIcon>
                  <ListItemText 
                    primary="Age" 
                    secondary={beneficiary.age ? `${beneficiary.age} years` : "Not specified"}
                  />
                </ListItem>
              </Grid>
              <Grid item xs={12} sm={6}>
                <ListItem disablePadding>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <TranslateIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Home Language" 
                    secondary={beneficiary.home_language || "Not specified"}
                  />
                </ListItem>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                  {beneficiary.youth && (
                    <Chip 
                      icon={<PersonIcon />} 
                      label="Youth" 
                      color="primary" 
                      variant="outlined"
                      size="small"
                    />
                  )}
                  {beneficiary.disability && (
                    <Chip 
                      icon={<AccessibilityNewIcon />} 
                      label={beneficiary.disability_type ? `Disability: ${beneficiary.disability_type}` : "Disability"} 
                      color="secondary" 
                      variant="outlined"
                      size="small"
                    />
                  )}
                  {beneficiary.non_rsa_citizen && (
                    <Chip 
                      icon={<PublicIcon />} 
                      label="Non-RSA Citizen" 
                      color="warning" 
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Contact Information */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="bold">
                Contact Information
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <ListItem disablePadding>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <PhoneIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Mobile Phone" 
                    secondary={beneficiary.mobile_phone || "Not specified"}
                  />
                </ListItem>
              </Grid>
              <Grid item xs={12} sm={6}>
                <ListItem disablePadding>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <EmailIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Email" 
                    secondary={beneficiary.email || "Not specified"}
                  />
                </ListItem>
              </Grid>
              <Grid item xs={12} sm={6}>
                <ListItem disablePadding>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <PhoneIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Guardian Mobile" 
                    secondary={beneficiary.parent_guardian_mobile || "Not specified"}
                  />
                </ListItem>
              </Grid>
              <Grid item xs={12} sm={6}>
                <ListItem disablePadding>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <EmailIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Guardian Email" 
                    secondary={beneficiary.parent_guardian_email || "Not specified"}
                  />
                </ListItem>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Address Information */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HomeIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="bold">
                Address Information
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <ListItem disablePadding>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <LocationOnIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Province" 
                    secondary={beneficiary.learner_province || "Not specified"}
                  />
                </ListItem>
              </Grid>
              <Grid item xs={12} sm={6}>
                <ListItem disablePadding>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <LocationOnIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="District Municipality" 
                    secondary={beneficiary.learner_municipality || "Not specified"}
                  />
                </ListItem>
              </Grid>
              <Grid item xs={12} sm={6}>
                <ListItem disablePadding>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <LocationOnIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Residential Area" 
                    secondary={beneficiary.residential_area || "Not specified"}
                  />
                </ListItem>
              </Grid>
              <Grid item xs={12} sm={6}>
                <ListItem disablePadding>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <LocationOnIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Area Type" 
                    secondary={beneficiary.area_type || "Not specified"}
                  />
                </ListItem>
              </Grid>
              {hasValue(beneficiary.physical_address_line1) && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Physical Address
                  </Typography>
                  <Typography variant="body2">
                    {beneficiary.physical_address_line1}
                    {beneficiary.physical_address_line2 && `, ${beneficiary.physical_address_line2}`}
                    {beneficiary.physical_address_code && `, ${beneficiary.physical_address_code}`}
                  </Typography>
                </Grid>
              )}
              {hasValue(beneficiary.postal_address_line1) && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Postal Address
                  </Typography>
                  <Typography variant="body2">
                    {beneficiary.postal_address_line1}
                    {beneficiary.postal_address_line2 && `, ${beneficiary.postal_address_line2}`}
                    {beneficiary.postal_code && `, ${beneficiary.postal_code}`}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Programme Information */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SchoolIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="bold">
                Programme Information
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <ListItem disablePadding>
                  <ListItemText 
                    primary="Programme Type" 
                    secondary={beneficiary.learning_programme_type || "Not specified"}
                  />
                </ListItem>
              </Grid>
              <Grid item xs={12} sm={6}>
                <ListItem disablePadding>
                  <ListItemText 
                    primary="Status" 
                    secondary={
                      <Chip 
                        label={beneficiary.status || "Active"} 
                        size="small"
                        color={beneficiary.status === 'Active' ? 'success' : 
                               beneficiary.status === 'Completed' ? 'primary' : 'default'}
                      />
                    }
                  />
                </ListItem>
              </Grid>
              <Grid item xs={12} sm={6}>
                <ListItem disablePadding>
                  <ListItemText 
                    primary="Start Date" 
                    secondary={formatDate(beneficiary.programme_start_date)}
                  />
                </ListItem>
              </Grid>
              <Grid item xs={12} sm={6}>
                <ListItem disablePadding>
                  <ListItemText 
                    primary="Completion Date" 
                    secondary={formatDate(beneficiary.programme_completion_date)}
                  />
                </ListItem>
              </Grid>
              {hasValue(beneficiary.programme_outcome) && (
                <Grid item xs={12} sm={6}>
                  <ListItem disablePadding>
                    <ListItemText 
                      primary="Outcome" 
                      secondary={beneficiary.programme_outcome}
                    />
                  </ListItem>
                </Grid>
              )}
              {hasValue(beneficiary.ofo_code) && (
                <Grid item xs={12} sm={6}>
                  <ListItem disablePadding>
                    <ListItemText 
                      primary="OFO Code" 
                      secondary={beneficiary.ofo_code}
                    />
                  </ListItem>
                </Grid>
              )}
              {hasValue(beneficiary.nqf_level) && (
                <Grid item xs={12} sm={6}>
                  <ListItem disablePadding>
                    <ListItemText 
                      primary="NQF Level" 
                      secondary={beneficiary.nqf_level}
                    />
                  </ListItem>
                </Grid>
              )}
              {hasValue(beneficiary.qualification_description) && (
                <Grid item xs={12}>
                  <ListItem disablePadding>
                    <ListItemText 
                      primary="Programme Description" 
                      secondary={beneficiary.qualification_description}
                    />
                  </ListItem>
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Employment & Training */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WorkIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="bold">
                Employment & Training
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {hasValue(beneficiary.employment_status) && (
                <Grid item xs={12} sm={6}>
                  <ListItem disablePadding>
                    <ListItemText 
                      primary="Employment Status" 
                      secondary={beneficiary.employment_status}
                    />
                  </ListItem>
                </Grid>
              )}
              {hasValue(beneficiary.current_employer) && (
                <Grid item xs={12} sm={6}>
                  <ListItem disablePadding>
                    <ListItemText 
                      primary="Current Employer" 
                      secondary={beneficiary.current_employer}
                    />
                  </ListItem>
                </Grid>
              )}
              {hasValue(beneficiary.training_provider_name) && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Training Provider
                  </Typography>
                  <Typography variant="body2">
                    {beneficiary.training_provider_name}
                    {beneficiary.training_provider_contact_details && ` | ${beneficiary.training_provider_contact_details}`}
                  </Typography>
                </Grid>
              )}
              {hasValue(beneficiary.monthly_income) && parseFloat(beneficiary.monthly_income) > 0 && (
                <Grid item xs={12} sm={6}>
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <MonetizationOnIcon fontSize="small" color="action" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Monthly Income" 
                      secondary={formatCurrency(beneficiary.monthly_income)}
                    />
                  </ListItem>
                </Grid>
              )}
              {hasValue(beneficiary.skills) && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Skills
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {beneficiary.skills.split(',').map((skill, index) => (
                      <Chip key={index} label={skill.trim()} size="small" />
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Financial Information */}
        {(hasValue(beneficiary.seta_funded) || hasValue(beneficiary.amount_spent_per_learner)) && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PaymentIcon color="primary" />
                <Typography variant="subtitle1" fontWeight="bold">
                  Financial Information
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {hasValue(beneficiary.seta_funded) && (
                  <Grid item xs={12} sm={6}>
                    <ListItem disablePadding>
                      <ListItemText 
                        primary="SETA Funded" 
                        secondary={
                          <Chip 
                            label={beneficiary.seta_funded ? "Yes" : "No"} 
                            size="small"
                            color={beneficiary.seta_funded ? "success" : "default"}
                          />
                        }
                      />
                    </ListItem>
                  </Grid>
                )}
                {hasValue(beneficiary.amount_spent_per_learner) && (
                  <Grid item xs={12} sm={6}>
                    <ListItem disablePadding>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <MonetizationOnIcon fontSize="small" color="action" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Amount Spent" 
                        secondary={formatCurrency(beneficiary.amount_spent_per_learner)}
                      />
                    </ListItem>
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Notes */}
        {hasValue(beneficiary.notes) && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotesIcon color="primary" />
                <Typography variant="subtitle1" fontWeight="bold">
                  Notes
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {beneficiary.notes}
              </Typography>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Metadata */}
        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            Created: {formatDate(beneficiary.created_at)}
            {beneficiary.updated_at && ` • Updated: ${formatDate(beneficiary.updated_at)}`}
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={() => {
            onClose();
            onEditClick();
          }}
          variant="outlined"
          startIcon={<PersonIcon />}
        >
          Edit Beneficiary
        </Button>
        <Button 
          onClick={onClose} 
          variant="contained"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
});

const Beneficiaries = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectTitle, setProjectTitle] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Initialize form with ALL required fields
  const initialFormData = {
    // Personal Information
    first_name: "",
    last_name: "",
    initials: "",
    id_number: "",
    date_of_birth: "",
    gender: "",
    race: "",
    age: "",
    home_language: "English",
    
    // Contact Information
    mobile_phone: "",
    email_address: "",
    parent_guardian_mobile: "",
    parent_guardian_email: "",
    
    // Demographic Information
    youth: true,
    disability: false,
    disability_type: "",
    non_rsa_citizen: false,
    
    // Address Information
    learner_province: "",
    learner_district_municipality: "",
    learner_local_municipality: "",
    residential_area: "",
    area_type: "",
    physical_address_line1: "",
    physical_address_line2: "",
    physical_address_code: "",
    postal_address_line1: "",
    postal_address_line2: "",
    postal_code: "",
    
    // Programme Information
    type_of_learning_programme: "Training",
    programme_start_date: new Date().toISOString().split('T')[0],
    programme_completion_date: "",
    certificate_issue_date: "",
    programme_outcome: "",
    status: "Active",
    
    // Qualification Information
    ofo_code: "",
    nqf_level: "",
    qualification_id: "",
    programme_description: "",
    learnership_id: "",
    unit_standard_id: "",
    
    // Employer Information
    employer_name: "",
    employer_sdl_number: "",
    employer_contact_details: "",
    
    // Training Provider Information
    training_provider_name: "",
    training_provider_sdl_number: "",
    training_provider_contact_details: "",
    training_provider_type: "",
    training_provider_province: "",
    training_provider_code: "",
    training_provider_etqa_id: "",
    training_provider_postal_address: "",
    training_provider_physical_address: "",
    training_provider_accreditation_start_date: "",
    training_provider_province_code: "",
    
    // Financial Information
    seta_industry_funded: false,
    amount_spent_per_learner: "0",
    
    // Additional Fields
    agreement_moa_number: "",
    project_number: "",
    activity_number: "",
    app_sub_programme: "",
    
    // School Information
    last_school_emis: "",
    last_school_year: "",
    
    // Non-NQF Fields
    non_nqf_intervention_subfield: "",
    non_nqf_intervention_status: "",
    non_nqf_intervention_credit: "",
    
    // Employment Information
    employment_status: "",
    current_employer: "",
    monthly_income: "0",
    skills: "",
    
    // Validation Fields
    valid_id_number_length: true,
    valid_age_for_youth: true,
    correctly_reported_youth: true,
    correctly_reported_gender: true,
    correctly_reported_race: true,
    
    // Notes
    notes: "",
    validation_errors: "",
    beneficiary_status: "Current"
  };

  const [formData, setFormData] = useState(initialFormData);

  // Memoize formData to prevent unnecessary re-renders
  const memoizedFormData = useMemo(() => formData, [formData]);

  useEffect(() => {
    fetchProjectAndBeneficiaries();
  }, [projectId]);

  const fetchProjectAndBeneficiaries = async () => {
    try {
      setLoading(true);
      
      // Fetch project details
      const projectRes = await axios.get(`${API_BASE}/api/projects/${projectId}`);
      if (projectRes.data) {
        setProjectTitle(projectRes.data.name || `Project #${projectId}`);
      }
      
      // Fetch beneficiaries for this project
      const beneficiariesRes = await axios.get(
        `${API_BASE}/api/projects/${projectId}/beneficiaries`
      );
      setBeneficiaries(beneficiariesRes.data);
      
    } catch (err) {
      console.error("Error fetching data:", err);
      showSnackbar("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Fix the handleInputChange to prevent re-renders on every keystroke
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    
    // Use functional update to ensure we have the latest state
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);

  // Fix for Select components
  const handleSelectChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({ ...initialFormData });
    setSelectedBeneficiary(null);
    setIsEdit(false);
    setActiveTab(0);
  }, [initialFormData]);

  const handleAddBeneficiary = async () => {
    try {
      // Validate required fields
      if (!formData.first_name.trim()) {
        showSnackbar("First name is required", "error");
        return;
      }
      if (!formData.last_name.trim()) {
        showSnackbar("Last name is required", "error");
        return;
      }
      if (!formData.id_number.trim()) {
        showSnackbar("ID number is required", "error");
        return;
      }

      // Map frontend field names to backend field names
      const dataToSend = {
        // Required fields
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        id_number: formData.id_number.trim(),
        
        // Personal details with defaults
        gender: formData.gender || "",
        age: formData.age ? parseInt(formData.age) : null,
        race: formData.race || "",
        initials: formData.initials || "",
        date_of_birth: formData.date_of_birth || null,
        home_language: formData.home_language || "English",
        
        // Contact information
        mobile_phone: formData.mobile_phone || "",
        email: formData.email_address || "",
        parent_guardian_mobile: formData.parent_guardian_mobile || "",
        parent_guardian_email: formData.parent_guardian_email || "",
        
        // Demographic info
        disability: Boolean(formData.disability),
        disability_type: formData.disability_type || "",
        youth: Boolean(formData.youth),
        non_rsa_citizen: Boolean(formData.non_rsa_citizen),
        
        // Address info
        learner_province: formData.learner_province || "",
        learner_municipality: formData.learner_district_municipality || "",
        residential_area: formData.residential_area || "",
        area_type: formData.area_type || "",
        physical_address_line1: formData.physical_address_line1 || "",
        physical_address_line2: formData.physical_address_line2 || "",
        physical_address_code: formData.physical_address_code || "",
        postal_address_line1: formData.postal_address_line1 || "",
        postal_address_line2: formData.postal_address_line2 || "",
        postal_code: formData.postal_code || "",
        learner_local_municipality: formData.learner_local_municipality || "",
        
        // Programme info
        learning_programme_type: formData.type_of_learning_programme || "Training",
        programme_start_date: formData.programme_start_date || new Date().toISOString().split('T')[0],
        programme_completion_date: formData.programme_completion_date || null,
        certificate_issue_date: formData.certificate_issue_date || null,
        programme_outcome: formData.programme_outcome || "",
        status: formData.status || "Active",
        
        // Qualification info
        ofo_code: formData.ofo_code || "",
        nqf_level: formData.nqf_level || "",
        qualification_id: formData.qualification_id || "",
        qualification_description: formData.programme_description || "",
        learnership_id: formData.learnership_id || "",
        unit_standard_id: formData.unit_standard_id || "",
        
        // Employer info
        employer_name: formData.employer_name || "",
        employer_sdl_number: formData.employer_sdl_number || "",
        employer_contact_details: formData.employer_contact_details || "",
        
        // Training provider info
        training_provider_name: formData.training_provider_name || "",
        training_provider_sdl_number: formData.training_provider_sdl_number || "",
        training_provider_contact_details: formData.training_provider_contact_details || "",
        training_provider_type: formData.training_provider_type || "",
        training_provider_province: formData.training_provider_province || "",
        training_provider_code: formData.training_provider_code || "",
        training_provider_etqa_id: formData.training_provider_etqa_id || "",
        training_provider_postal_address: formData.training_provider_postal_address || "",
        training_provider_physical_address: formData.training_provider_physical_address || "",
        training_provider_accreditation_start_date: formData.training_provider_accreditation_start_date || null,
        training_provider_province_code: formData.training_provider_province_code || "",
        
        // Financial info
        seta_funded: Boolean(formData.seta_industry_funded),
        amount_spent_per_learner: formData.amount_spent_per_learner ? parseFloat(formData.amount_spent_per_learner) : 0,
        
        // Additional fields
        agreement_number: formData.agreement_moa_number || "",
        project_number: formData.project_number || "",
        activity_number: formData.activity_number || "",
        app_sub_programme: formData.app_sub_programme || "",
        
        // School info
        last_school_emis: formData.last_school_emis || "",
        last_school_year: formData.last_school_year || "",
        
        // Non-NQF fields
        non_nqf_subfield_id: formData.non_nqf_intervention_subfield || "",
        non_nqf_status_id: formData.non_nqf_intervention_status || "",
        non_nqf_credit: formData.non_nqf_intervention_credit || "",
        
        // Employment info
        employment_status: formData.employment_status || "",
        current_employer: formData.current_employer || "",
        monthly_income: formData.monthly_income ? parseFloat(formData.monthly_income) : 0,
        skills: formData.skills || "",
        
        // Validation fields
        valid_id_number_length: Boolean(formData.valid_id_number_length),
        valid_age_for_youth: Boolean(formData.valid_age_for_youth),
        correctly_reported_youth: Boolean(formData.correctly_reported_youth),
        correctly_reported_gender: Boolean(formData.correctly_reported_gender),
        correctly_reported_race: Boolean(formData.correctly_reported_race),
        
        // Notes
        notes: formData.notes || "",
        validation_errors: formData.validation_errors || "",
        beneficiary_status: formData.beneficiary_status || "Current"
      };

      console.log("Sending data to backend:", dataToSend);

      const response = await axios.post(
        `${API_BASE}/api/projects/${projectId}/beneficiaries`,
        dataToSend,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("Beneficiary added successfully:", response.data);
      showSnackbar("Beneficiary added successfully!");
      setOpenDialog(false);
      resetForm();
      fetchProjectAndBeneficiaries();
    } catch (err) {
      console.error("Error adding beneficiary:", err);
      console.error("Error response:", err.response?.data);
      
      let errorMessage = "Failed to add beneficiary. ";
      if (err.response?.data?.error) {
        errorMessage += err.response.data.error;
      } else if (err.response?.status === 409) {
        errorMessage = "ID number already exists in the system";
      }
      
      showSnackbar(errorMessage, "error");
    }
  };

  const handleUpdateBeneficiary = async () => {
    try {
      if (!selectedBeneficiary) return;

      // Validate required fields
      if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.id_number.trim()) {
        showSnackbar("First name, last name, and ID number are required", "error");
        return;
      }

      const updateData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        id_number: formData.id_number.trim(),
        gender: formData.gender || "",
        age: formData.age ? parseInt(formData.age) : null,
        race: formData.race || "",
        mobile_phone: formData.mobile_phone || "",
        email: formData.email_address || "",
        residential_area: formData.residential_area || "",
        learner_province: formData.learner_province || "",
        learner_municipality: formData.learner_district_municipality || "",
        disability: Boolean(formData.disability),
        youth: Boolean(formData.youth),
        non_rsa_citizen: Boolean(formData.non_rsa_citizen)
      };

      const response = await axios.put(
        `${API_BASE}/api/beneficiaries/${selectedBeneficiary.id}`,
        updateData
      );

      showSnackbar("Beneficiary updated successfully!");
      setOpenDialog(false);
      resetForm();
      fetchProjectAndBeneficiaries();
    } catch (err) {
      console.error("Error updating beneficiary:", err);
      showSnackbar(
        err.response?.data?.error || "Failed to update beneficiary",
        "error"
      );
    }
  };

  const handleDeleteBeneficiary = async () => {
    try {
      if (!selectedBeneficiary) return;

      await axios.delete(
        `${API_BASE}/api/beneficiaries/${selectedBeneficiary.id}`
      );

      showSnackbar("Beneficiary deleted successfully!");
      setMenuAnchorEl(null);
      fetchProjectAndBeneficiaries();
    } catch (err) {
      console.error("Error deleting beneficiary:", err);
      showSnackbar(
        err.response?.data?.error || "Failed to delete beneficiary",
        "error"
      );
    }
  };

  const handleMenuOpen = (event, beneficiary) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedBeneficiary(beneficiary);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleEditClick = useCallback(() => {
    if (!selectedBeneficiary) return;

    // For editing, populate the form with existing data
    setFormData(prev => ({
      ...prev,
      first_name: selectedBeneficiary.first_name || "",
      last_name: selectedBeneficiary.last_name || "",
      id_number: selectedBeneficiary.id_number || "",
      gender: selectedBeneficiary.gender || "",
      age: selectedBeneficiary.age || "",
      race: selectedBeneficiary.race || "",
      mobile_phone: selectedBeneficiary.mobile_phone || "",
      email_address: selectedBeneficiary.email || "",
      residential_area: selectedBeneficiary.residential_area || "",
      learner_province: selectedBeneficiary.learner_province || "",
      learner_district_municipality: selectedBeneficiary.learner_municipality || "",
      disability: selectedBeneficiary.disability || false,
      youth: selectedBeneficiary.youth || false,
      non_rsa_citizen: selectedBeneficiary.non_rsa_citizen || false,
    }));
    
    setIsEdit(true);
    setOpenDialog(true);
    handleMenuClose();
  }, [selectedBeneficiary]);

  const handleDeleteClick = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedBeneficiary.first_name} ${selectedBeneficiary.last_name}?`)) {
      handleDeleteBeneficiary();
    }
    handleMenuClose();
  };

  const handleSave = () => {
    if (isEdit) {
      handleUpdateBeneficiary();
    } else {
      handleAddBeneficiary();
    }
  };

  // Handle card click to show beneficiary details
  const handleCardClick = useCallback((beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setOpenDetailDialog(true);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
      {/* HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/dashboard")}
            sx={{ mb: 1 }}
            variant="outlined"
          >
            Back to Projects
          </Button>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Beneficiaries Management
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="subtitle1" color="text.secondary">
              Project: <strong>{projectTitle}</strong>
            </Typography>
            <Box sx={{ 
              bgcolor: 'primary.main', 
              color: 'white', 
              px: 2, 
              py: 0.5, 
              borderRadius: 2,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1
            }}>
              <PersonIcon fontSize="small" />
              <Typography variant="body2" fontWeight="bold">
                {beneficiaries.length} Beneficiary{beneficiaries.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm();
            setOpenDialog(true);
          }}
          size="large"
        >
          Add New Beneficiary
        </Button>
      </Box>

      {/* BENEFICIARIES GRID */}
      {beneficiaries.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center", mt: 4, borderRadius: 3 }}>
          <PersonIcon sx={{ fontSize: 80, color: "text.secondary", mb: 3, opacity: 0.7 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom fontWeight="medium">
            No beneficiaries found for this project
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
            Start by adding beneficiaries to track their progress and information.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              resetForm();
              setOpenDialog(true);
            }}
            size="large"
          >
            Add First Beneficiary
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {beneficiaries.map((beneficiary) => (
            <Grid item xs={12} sm={6} md={4} key={beneficiary.id}>
              <Card 
                sx={{ 
                  height: "100%", 
                  position: "relative", 
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': { 
                    boxShadow: 6,
                    transform: 'translateY(-4px)'
                  }
                }}
                onClick={() => handleCardClick(beneficiary)}
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
                    handleMenuOpen(e, beneficiary);
                  }}
                >
                  <MoreVertIcon />
                </IconButton>

                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: "primary.main", 
                        mr: 2, 
                        width: 56, 
                        height: 56,
                        fontSize: '1.5rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {beneficiary.first_name?.charAt(0)?.toUpperCase() || "B"}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" noWrap>
                        {beneficiary.first_name} {beneficiary.last_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ID: {beneficiary.id_number || "N/A"}
                      </Typography>
                    </Box>
                  </Box>

                  <Stack spacing={1.5} sx={{ mt: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <PersonIcon sx={{ mr: 1.5, fontSize: 20, color: "primary.main" }} />
                      <Typography variant="body2">
                        {beneficiary.gender || "Not specified"} • {beneficiary.age || "N/A"} years
                      </Typography>
                    </Box>
                    
                    {beneficiary.mobile_phone && (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <PhoneIcon sx={{ mr: 1.5, fontSize: 20, color: "primary.main" }} />
                        <Typography variant="body2">
                          {beneficiary.mobile_phone}
                        </Typography>
                      </Box>
                    )}
                    
                    {beneficiary.email && (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <EmailIcon sx={{ mr: 1.5, fontSize: 20, color: "primary.main" }} />
                        <Typography variant="body2" noWrap>
                          {beneficiary.email}
                        </Typography>
                      </Box>
                    )}
                    
                    {beneficiary.residential_area && (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <HomeIcon sx={{ mr: 1.5, fontSize: 20, color: "primary.main" }} />
                        <Typography variant="body2" sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {beneficiary.residential_area}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                  
                  <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <span>
                        Added: {new Date(beneficiary.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: beneficiary.status === 'Active' ? 'success.main' : 
                                 beneficiary.status === 'Completed' ? 'primary.main' : 'text.secondary'
                        }}
                      >
                        {beneficiary.status || 'Active'}
                      </Typography>
                    </Typography>
                    <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5 }}>
                      Click to view details →
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ADD/EDIT DIALOG WITH TABS */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        fullWidth 
        maxWidth="lg"
        scroll="paper"
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
          <Box>
            <Typography variant="h6" component="div" fontWeight="bold">
              {isEdit ? "Edit Beneficiary" : "Add New Beneficiary"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Project: {projectTitle}
            </Typography>
          </Box>
        </DialogTitle>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Personal Info" />
            <Tab label="Contact & Address" />
            <Tab label="Programme Details" />
            <Tab label="Employment & Training" />
            <Tab label="Financial & Other" />
          </Tabs>
        </Box>
        
        <DialogContent dividers sx={{ p: 0 }}>
          {/* TAB 1: Personal Information */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="First Name *"
                  name="first_name"
                  value={memoizedFormData.first_name}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  size="small"
                  error={!memoizedFormData.first_name.trim()}
                  helperText={!memoizedFormData.first_name.trim() ? "Required" : ""}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Last Name *"
                  name="last_name"
                  value={memoizedFormData.last_name}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  size="small"
                  error={!memoizedFormData.last_name.trim()}
                  helperText={!memoizedFormData.last_name.trim() ? "Required" : ""}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Initials"
                  name="initials"
                  value={memoizedFormData.initials}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="ID Number *"
                  name="id_number"
                  value={memoizedFormData.id_number}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  size="small"
                  error={!memoizedFormData.id_number.trim()}
                  helperText="13-digit South African ID"
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Date of Birth"
                  name="date_of_birth"
                  type="date"
                  value={memoizedFormData.date_of_birth}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Age"
                  name="age"
                  type="number"
                  value={memoizedFormData.age}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Gender *</InputLabel>
                  <Select
                    name="gender"
                    value={memoizedFormData.gender}
                    onChange={handleSelectChange}
                    label="Gender *"
                  >
                    <MenuItem value=""><em>Select Gender</em></MenuItem>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Race</InputLabel>
                  <Select
                    name="race"
                    value={memoizedFormData.race}
                    onChange={handleSelectChange}
                    label="Race"
                  >
                    <MenuItem value=""><em>Select Race</em></MenuItem>
                    <MenuItem value="African">African</MenuItem>
                    <MenuItem value="Coloured">Coloured</MenuItem>
                    <MenuItem value="Indian">Indian</MenuItem>
                    <MenuItem value="White">White</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Home Language</InputLabel>
                  <Select
                    name="home_language"
                    value={memoizedFormData.home_language}
                    onChange={handleSelectChange}
                    label="Home Language"
                  >
                    <MenuItem value="English">English</MenuItem>
                    <MenuItem value="Afrikaans">Afrikaans</MenuItem>
                    <MenuItem value="isiZulu">isiZulu</MenuItem>
                    <MenuItem value="isiXhosa">isiXhosa</MenuItem>
                    <MenuItem value="Sesotho">Sesotho</MenuItem>
                    <MenuItem value="Setswana">Setswana</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={memoizedFormData.youth}
                      onChange={handleInputChange}
                      name="youth"
                      color="primary"
                    />
                  }
                  label="Youth (18-35 years)"
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={memoizedFormData.disability}
                      onChange={handleInputChange}
                      name="disability"
                      color="primary"
                    />
                  }
                  label="Person with Disability"
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={memoizedFormData.non_rsa_citizen}
                      onChange={handleInputChange}
                      name="non_rsa_citizen"
                      color="primary"
                    />
                  }
                  label="Non-RSA Citizen"
                />
              </Grid>
              
              {memoizedFormData.disability && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Disability Type"
                    name="disability_type"
                    value={memoizedFormData.disability_type}
                    onChange={handleInputChange}
                    fullWidth
                    size="small"
                  />
                </Grid>
              )}
            </Grid>
          </TabPanel>
          
          {/* TAB 2: Contact & Address */}
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Mobile Phone"
                  name="mobile_phone"
                  value={memoizedFormData.mobile_phone}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  name="email_address"
                  type="email"
                  value={memoizedFormData.email_address}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Guardian Mobile"
                  name="parent_guardian_mobile"
                  value={memoizedFormData.parent_guardian_mobile}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Guardian Email"
                  name="parent_guardian_email"
                  type="email"
                  value={memoizedFormData.parent_guardian_email}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Residential Address
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Province"
                  name="learner_province"
                  value={memoizedFormData.learner_province}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  label="District Municipality"
                  name="learner_district_municipality"
                  value={memoizedFormData.learner_district_municipality}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Local Municipality"
                  name="learner_local_municipality"
                  value={memoizedFormData.learner_local_municipality}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Residential Area"
                  name="residential_area"
                  value={memoizedFormData.residential_area}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Area Type</InputLabel>
                  <Select
                    name="area_type"
                    value={memoizedFormData.area_type}
                    onChange={handleSelectChange}
                    label="Area Type"
                  >
                    <MenuItem value=""><em>Select Area Type</em></MenuItem>
                    <MenuItem value="Urban">Urban</MenuItem>
                    <MenuItem value="Rural">Rural</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Physical Address
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Address Line 1"
                  name="physical_address_line1"
                  value={memoizedFormData.physical_address_line1}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Address Line 2"
                  name="physical_address_line2"
                  value={memoizedFormData.physical_address_line2}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Postal Code"
                  name="postal_code"
                  value={memoizedFormData.postal_code}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Address Code"
                  name="physical_address_code"
                  value={memoizedFormData.physical_address_code}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* TAB 3: Programme Details */}
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Learning Programme Type</InputLabel>
                  <Select
                    name="type_of_learning_programme"
                    value={memoizedFormData.type_of_learning_programme}
                    onChange={handleSelectChange}
                    label="Learning Programme Type"
                  >
                    <MenuItem value="Training">Training</MenuItem>
                    <MenuItem value="Workshop">Workshop</MenuItem>
                    <MenuItem value="Seminar">Seminar</MenuItem>
                    <MenuItem value="Course">Course</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={memoizedFormData.status}
                    onChange={handleSelectChange}
                    label="Status"
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                    <MenuItem value="Graduated">Graduated</MenuItem>
                    <MenuItem value="Dropped">Dropped</MenuItem>
                    <MenuItem value="Transferred">Transferred</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Programme Start Date"
                  name="programme_start_date"
                  type="date"
                  value={memoizedFormData.programme_start_date}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Programme Completion Date"
                  name="programme_completion_date"
                  type="date"
                  value={memoizedFormData.programme_completion_date}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Certificate Issue Date"
                  name="certificate_issue_date"
                  type="date"
                  value={memoizedFormData.certificate_issue_date}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Programme Outcome</InputLabel>
                  <Select
                    name="programme_outcome"
                    value={memoizedFormData.programme_outcome}
                    onChange={handleSelectChange}
                    label="Programme Outcome"
                  >
                    <MenuItem value=""><em>Select Outcome</em></MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Certified">Certified</MenuItem>
                    <MenuItem value="Not Completed">Not Completed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="OFO Code"
                  name="ofo_code"
                  value={memoizedFormData.ofo_code}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="NQF Level"
                  name="nqf_level"
                  value={memoizedFormData.nqf_level}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Qualification ID"
                  name="qualification_id"
                  value={memoizedFormData.qualification_id}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Learnership ID"
                  name="learnership_id"
                  value={memoizedFormData.learnership_id}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Programme Description"
                  name="programme_description"
                  value={memoizedFormData.programme_description}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* TAB 4: Employment & Training */}
          <TabPanel value={activeTab} index={3}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Employment Information
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Employment Status</InputLabel>
                  <Select
                    name="employment_status"
                    value={memoizedFormData.employment_status}
                    onChange={handleSelectChange}
                    label="Employment Status"
                  >
                    <MenuItem value=""><em>Select Status</em></MenuItem>
                    <MenuItem value="Employed">Employed</MenuItem>
                    <MenuItem value="Unemployed">Unemployed</MenuItem>
                    <MenuItem value="Self-Employed">Self-Employed</MenuItem>
                    <MenuItem value="Student">Student</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Current Employer"
                  name="current_employer"
                  value={memoizedFormData.current_employer}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Employer Name"
                  name="employer_name"
                  value={memoizedFormData.employer_name}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Employer SDL Number"
                  name="employer_sdl_number"
                  value={memoizedFormData.employer_sdl_number}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Employer Contact Details"
                  name="employer_contact_details"
                  value={memoizedFormData.employer_contact_details}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
                  Training Provider Information
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Training Provider Name"
                  name="training_provider_name"
                  value={memoizedFormData.training_provider_name}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Training Provider SDL Number"
                  name="training_provider_sdl_number"
                  value={memoizedFormData.training_provider_sdl_number}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Provider Type</InputLabel>
                  <Select
                    name="training_provider_type"
                    value={memoizedFormData.training_provider_type}
                    onChange={handleSelectChange}
                    label="Provider Type"
                  >
                    <MenuItem value=""><em>Select Type</em></MenuItem>
                    <MenuItem value="Private">Private</MenuItem>
                    <MenuItem value="Public">Public</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Training Provider Province"
                  name="training_provider_province"
                  value={memoizedFormData.training_provider_province}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Training Provider Code"
                  name="training_provider_code"
                  value={memoizedFormData.training_provider_code}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Training Provider ETQA ID"
                  name="training_provider_etqa_id"
                  value={memoizedFormData.training_provider_etqa_id}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Training Provider Postal Address"
                  name="training_provider_postal_address"
                  value={memoizedFormData.training_provider_postal_address}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Training Provider Physical Address"
                  name="training_provider_physical_address"
                  value={memoizedFormData.training_provider_physical_address}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Training Provider Contact Details"
                  name="training_provider_contact_details"
                  value={memoizedFormData.training_provider_contact_details}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Accreditation Start Date"
                  name="training_provider_accreditation_start_date"
                  type="date"
                  value={memoizedFormData.training_provider_accreditation_start_date}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* TAB 5: Financial & Other */}
          <TabPanel value={activeTab} index={4}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={memoizedFormData.seta_industry_funded}
                      onChange={handleInputChange}
                      name="seta_industry_funded"
                      color="primary"
                    />
                  }
                  label="SETA Industry Funded"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Amount Spent per Learner"
                  name="amount_spent_per_learner"
                  type="number"
                  value={memoizedFormData.amount_spent_per_learner}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>R</Typography>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Monthly Income"
                  name="monthly_income"
                  type="number"
                  value={memoizedFormData.monthly_income}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>R</Typography>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Agreement/MOA Number"
                  name="agreement_moa_number"
                  value={memoizedFormData.agreement_moa_number}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Project Number"
                  name="project_number"
                  value={memoizedFormData.project_number}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Activity Number"
                  name="activity_number"
                  value={memoizedFormData.activity_number}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="App Sub Programme"
                  name="app_sub_programme"
                  value={memoizedFormData.app_sub_programme}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Unit Standard ID"
                  name="unit_standard_id"
                  value={memoizedFormData.unit_standard_id}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last School EMIS"
                  name="last_school_emis"
                  value={memoizedFormData.last_school_emis}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last School Year"
                  name="last_school_year"
                  value={memoizedFormData.last_school_year}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Skills"
                  name="skills"
                  value={memoizedFormData.skills}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  name="notes"
                  value={memoizedFormData.notes}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                />
              </Grid>
            </Grid>
          </TabPanel>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Cancel
          </Button>
          <Box sx={{ flexGrow: 1 }}>
            {activeTab > 0 && (
              <Button 
                onClick={() => setActiveTab(activeTab - 1)}
                color="inherit"
              >
                Previous
              </Button>
            )}
          </Box>
          {activeTab < 4 ? (
            <Button 
              onClick={() => setActiveTab(activeTab + 1)}
              variant="outlined"
            >
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleSave} 
              variant="contained" 
              color="warning"
              disabled={!memoizedFormData.first_name.trim() || !memoizedFormData.last_name.trim() || !memoizedFormData.id_number.trim()}
            >
              {isEdit ? "Update" : "Save"} Beneficiary
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* DETAIL VIEW DIALOG */}
      {selectedBeneficiary && (
        <BeneficiaryDetailView 
          beneficiary={selectedBeneficiary}
          open={openDetailDialog}
          onClose={() => {
            setOpenDetailDialog(false);
            setSelectedBeneficiary(null);
          }}
          onEditClick={handleEditClick}
        />
      )}

      {/* MENU */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleEditClick}>
          Edit
        </MenuItem>
        <MenuItem onClick={() => handleCardClick(selectedBeneficiary)}>
          View Details
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: "error.main" }}>
          Delete
        </MenuItem>
      </Menu>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ minWidth: 300 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Beneficiaries;