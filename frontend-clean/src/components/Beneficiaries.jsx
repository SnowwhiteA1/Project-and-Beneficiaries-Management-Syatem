import React, { useEffect, useState } from "react";
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
  Divider,
  InputAdornment,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  CardMedia
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
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import BadgeIcon from "@mui/icons-material/Badge";
import LanguageIcon from "@mui/icons-material/Language";
import AccessibleIcon from "@mui/icons-material/Accessible";
import PublicIcon from "@mui/icons-material/Public";
import BusinessIcon from "@mui/icons-material/Business";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import DescriptionIcon from "@mui/icons-material/Description";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ImageIcon from "@mui/icons-material/Image";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = "http://localhost:5050";

const Beneficiaries = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectTitle, setProjectTitle] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Document upload states
  const [idDocument, setIdDocument] = useState(null);
  const [qualificationDocument, setQualificationDocument] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [existingDocuments, setExistingDocuments] = useState({
    id_document_url: "",
    qualification_document_url: ""
  });

  // South African provinces
  const provinces = [
    "Eastern Cape",
    "Free State",
    "Gauteng",
    "KwaZulu-Natal",
    "Limpopo",
    "Mpumalanga",
    "North West",
    "Northern Cape",
    "Western Cape"
  ];

  // South African languages
  const languages = [
    "English",
    "Afrikaans",
    "isiZulu",
    "isiXhosa",
    "Sesotho",
    "Setswana",
    "Sesotho sa Leboa",
    "Xitsonga",
    "siSwati",
    "Tshivenda",
    "isiNdebele",
    "Other"
  ];

  // NQF Levels
  const nqfLevels = [
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"
  ];

  // Initialize form with ALL required fields from database
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
    beneficiary_status: "Current",
    
    // Document URLs (will be populated from backend)
    id_document_url: "",
    qualification_document_url: ""
  };

  const [formData, setFormData] = useState({ ...initialFormData });

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

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({ ...initialFormData });
    setIdDocument(null);
    setQualificationDocument(null);
    setExistingDocuments({
      id_document_url: "",
      qualification_document_url: ""
    });
    setSelectedBeneficiary(null);
    setIsEdit(false);
    setActiveTab(0);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.first_name.trim()) errors.push("First name is required");
    if (!formData.last_name.trim()) errors.push("Last name is required");
    if (!formData.id_number.trim()) errors.push("ID number is required");
    if (!formData.gender.trim()) errors.push("Gender is required");
    
    if (formData.age) {
      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
        errors.push("Age must be between 0 and 120");
      }
    }
    
    return errors;
  };

  const handleFileUpload = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showSnackbar("File size must be less than 5MB", "error");
      return;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      showSnackbar("Only JPG, PNG, and PDF files are allowed", "error");
      return;
    }

    if (type === 'id') {
      setIdDocument(file);
    } else if (type === 'qualification') {
      setQualificationDocument(file);
    }
  };

  const removeDocument = (type) => {
    if (type === 'id') {
      setIdDocument(null);
      setFormData(prev => ({
        ...prev,
        id_document_url: ""
      }));
    } else if (type === 'qualification') {
      setQualificationDocument(null);
      setFormData(prev => ({
        ...prev,
        qualification_document_url: ""
      }));
    }
  };

  const uploadDocuments = async () => {
    const formDataToSend = new FormData();
    let documentsUploaded = {
      id_document_url: existingDocuments.id_document_url,
      qualification_document_url: existingDocuments.qualification_document_url
    };

    if (idDocument) {
      formDataToSend.append('id_document', idDocument);
    }
    if (qualificationDocument) {
      formDataToSend.append('qualification_document', qualificationDocument);
    }

    if (formDataToSend.has('id_document') || formDataToSend.has('qualification_document')) {
      try {
        setIsUploading(true);
        setUploadProgress(30);

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + 10;
          });
        }, 300);

        // Upload documents
        const uploadResponse = await axios.post(
          `${API_BASE}/api/beneficiaries/upload`,
          formDataToSend,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        clearInterval(progressInterval);
        setUploadProgress(100);
        
        documentsUploaded = {
          ...documentsUploaded,
          ...uploadResponse.data
        };

        showSnackbar("Documents uploaded successfully", "success");
      } catch (err) {
        console.error("Error uploading documents:", err);
        showSnackbar("Failed to upload documents", "error");
      } finally {
        setIsUploading(false);
        setTimeout(() => setUploadProgress(0), 1000);
      }
    }

    return documentsUploaded;
  };

  const handleAddBeneficiary = async () => {
    try {
      // Validate form
      const errors = validateForm();
      if (errors.length > 0) {
        showSnackbar(errors.join(", "), "error");
        return;
      }

      // Upload documents first
      setIsUploading(true);
      const uploadedDocuments = await uploadDocuments();
      setIsUploading(false);

      // Prepare data for backend
      const dataToSend = {
        // Personal Information
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        learner_names: formData.first_name.trim(),
        learner_surname: formData.last_name.trim(),
        learner_initials: formData.initials || "",
        id_number: formData.id_number.trim(),
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || "",
        age: formData.age ? parseInt(formData.age) : null,
        race: formData.race || "",
        home_language: formData.home_language || "English",
        
        // Contact Information
        mobile_phone: formData.mobile_phone || "",
        email: formData.email_address || "",
        parent_guardian_mobile: formData.parent_guardian_mobile || "",
        parent_guardian_email: formData.parent_guardian_email || "",
        
        // Demographic Information
        youth: Boolean(formData.youth),
        disability: Boolean(formData.disability),
        disability_type: formData.disability_type || "",
        non_rsa_citizen: Boolean(formData.non_rsa_citizen),
        
        // Address Information
        learner_province: formData.learner_province || "",
        learner_district_municipality: formData.learner_district_municipality || "",
        learner_local_municipality: formData.learner_local_municipality || "",
        residential_area: formData.residential_area || "",
        area_type: formData.area_type || "",
        physical_address_line1: formData.physical_address_line1 || "",
        physical_address_line2: formData.physical_address_line2 || "",
        postal_address_line1: formData.postal_address_line1 || "",
        postal_address_line2: formData.postal_address_line2 || "",
        postal_code: formData.postal_code || "",
        
        // Programme Information
        learning_programme_type: formData.type_of_learning_programme || "Training",
        programme_start_date: formData.programme_start_date || new Date().toISOString().split('T')[0],
        programme_completion_date: formData.programme_completion_date || null,
        certificate_issue_date: formData.certificate_issue_date || null,
        programme_outcome: formData.programme_outcome || "",
        status: formData.status || "Active",
        
        // Qualification Information
        ofo_code: formData.ofo_code || "",
        nqf_level: formData.nqf_level || "",
        qualification_id: formData.qualification_id || "",
        qualification_description: formData.programme_description || "",
        learnership_id: formData.learnership_id || "",
        unit_standard_id: formData.unit_standard_id || "",
        
        // Employer Information
        employer_name: formData.employer_name || "",
        employer_sdl_number: formData.employer_sdl_number || "",
        employer_contact_details: formData.employer_contact_details || "",
        
        // Training Provider Information
        training_provider_name: formData.training_provider_name || "",
        training_provider_sdl_number: formData.training_provider_sdl_number || "",
        training_provider_contact_details: formData.training_provider_contact_details || "",
        training_provider_type: formData.training_provider_type || "",
        training_provider_province: formData.training_provider_province || "",
        training_provider_code: formData.training_provider_code || "",
        training_provider_etqa_id: formData.training_provider_etqa_id || "",
        training_provider_postal_address: formData.training_provider_postal_address || "",
        training_provider_physical_address: formData.training_provider_physical_address || "",
        
        // Financial Information
        seta_funded: Boolean(formData.seta_industry_funded),
        amount_spent_per_learner: formData.amount_spent_per_learner ? parseFloat(formData.amount_spent_per_learner) : 0,
        
        // Additional Fields
        agreement_number: formData.agreement_moa_number || "",
        project_number: formData.project_number || "",
        activity_number: formData.activity_number || "",
        app_sub_programme: formData.app_sub_programme || "",
        
        // School Information
        last_school_emis: formData.last_school_emis || "",
        last_school_year: formData.last_school_year || "",
        
        // Non-NQF Fields
        non_nqf_subfield_id: formData.non_nqf_intervention_subfield || "",
        non_nqf_status_id: formData.non_nqf_intervention_status || "",
        non_nqf_credit: formData.non_nqf_intervention_credit || "",
        
        // Employment Information
        employment_status: formData.employment_status || "",
        current_employer: formData.current_employer || "",
        monthly_income: formData.monthly_income ? parseFloat(formData.monthly_income) : 0,
        skills: formData.skills || "",
        
        // Document URLs
        id_document_url: uploadedDocuments.id_document_url || "",
        qualification_document_url: uploadedDocuments.qualification_document_url || "",
        
        // Notes
        notes: formData.notes || "",
        beneficiary_status: formData.beneficiary_status || "Current"
      };

      const response = await axios.post(
        `${API_BASE}/api/projects/${projectId}/beneficiaries`,
        dataToSend,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      showSnackbar("Beneficiary added successfully!");
      setOpenDialog(false);
      resetForm();
      fetchProjectAndBeneficiaries();
    } catch (err) {
      console.error("Error adding beneficiary:", err);
      let errorMessage = "Failed to add beneficiary. ";
      
      if (err.response?.data?.error) {
        if (err.response.data.error.includes("ID number already exists")) {
          errorMessage = "ID number already exists in the system.";
        } else {
          errorMessage += err.response.data.error;
        }
      } else if (err.response?.status === 500) {
        errorMessage += "Internal server error.";
      } else if (err.message) {
        errorMessage += err.message;
      }
      
      showSnackbar(errorMessage, "error");
    }
  };

  const handleUpdateBeneficiary = async () => {
    try {
      if (!selectedBeneficiary) return;

      // Validate form
      const errors = validateForm();
      if (errors.length > 0) {
        showSnackbar(errors.join(", "), "error");
        return;
      }

      // Upload documents if new ones are added
      let documentsUpdated = {};
      if (idDocument || qualificationDocument) {
        setIsUploading(true);
        documentsUpdated = await uploadDocuments();
        setIsUploading(false);
      }

      // Prepare update data
      const updateData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        learner_names: formData.first_name.trim(),
        learner_surname: formData.last_name.trim(),
        id_number: formData.id_number.trim(),
        gender: formData.gender || "",
        age: formData.age ? parseInt(formData.age) : null,
        race: formData.race || "",
        mobile_phone: formData.mobile_phone || "",
        email: formData.email_address || "",
        residential_area: formData.residential_area || "",
        learner_province: formData.learner_province || "",
        learner_district_municipality: formData.learner_district_municipality || "",
        disability: Boolean(formData.disability),
        youth: Boolean(formData.youth),
        non_rsa_citizen: Boolean(formData.non_rsa_citizen),
        beneficiary_status: formData.beneficiary_status || "Current",
        status: formData.status || "Active"
      };

      // Add document URLs if uploaded
      if (documentsUpdated.id_document_url) {
        updateData.id_document_url = documentsUpdated.id_document_url;
      }
      if (documentsUpdated.qualification_document_url) {
        updateData.qualification_document_url = documentsUpdated.qualification_document_url;
      }

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

  const handleEditClick = () => {
    if (!selectedBeneficiary) return;

    // Load beneficiary details
    setFormData({
      first_name: selectedBeneficiary.first_name || "",
      last_name: selectedBeneficiary.last_name || "",
      initials: selectedBeneficiary.initials || "",
      id_number: selectedBeneficiary.id_number || "",
      date_of_birth: selectedBeneficiary.date_of_birth || "",
      gender: selectedBeneficiary.gender || "",
      race: selectedBeneficiary.race || "",
      age: selectedBeneficiary.age || "",
      home_language: selectedBeneficiary.home_language || "English",
      mobile_phone: selectedBeneficiary.mobile_phone || "",
      email_address: selectedBeneficiary.email || "",
      parent_guardian_mobile: selectedBeneficiary.parent_guardian_mobile || "",
      parent_guardian_email: selectedBeneficiary.parent_guardian_email || "",
      youth: selectedBeneficiary.youth || true,
      disability: selectedBeneficiary.disability || false,
      disability_type: selectedBeneficiary.disability_type || "",
      non_rsa_citizen: selectedBeneficiary.non_rsa_citizen || false,
      learner_province: selectedBeneficiary.learner_province || "",
      learner_district_municipality: selectedBeneficiary.learner_municipality || "",
      learner_local_municipality: selectedBeneficiary.learner_local_municipality || "",
      residential_area: selectedBeneficiary.residential_area || "",
      area_type: selectedBeneficiary.area_type || "",
      type_of_learning_programme: selectedBeneficiary.learning_programme_type || "Training",
      programme_start_date: selectedBeneficiary.programme_start_date || new Date().toISOString().split('T')[0],
      programme_completion_date: selectedBeneficiary.programme_completion_date || "",
      certificate_issue_date: selectedBeneficiary.certificate_issue_date || "",
      programme_outcome: selectedBeneficiary.programme_outcome || "",
      status: selectedBeneficiary.status || "Active",
      ofo_code: selectedBeneficiary.ofo_code || "",
      nqf_level: selectedBeneficiary.nqf_level || "",
      qualification_id: selectedBeneficiary.qualification_id || "",
      programme_description: selectedBeneficiary.programme_description || "",
      learnership_id: selectedBeneficiary.learnership_id || "",
      unit_standard_id: selectedBeneficiary.unit_standard_id || "",
      employer_name: selectedBeneficiary.employer_name || "",
      employer_sdl_number: selectedBeneficiary.employer_sdl_number || "",
      employer_contact_details: selectedBeneficiary.employer_contact_details || "",
      training_provider_name: selectedBeneficiary.training_provider_name || "",
      training_provider_sdl_number: selectedBeneficiary.training_provider_sdl_number || "",
      training_provider_contact_details: selectedBeneficiary.training_provider_contact_details || "",
      training_provider_type: selectedBeneficiary.training_provider_type || "",
      training_provider_province: selectedBeneficiary.training_provider_province || "",
      training_provider_code: selectedBeneficiary.training_provider_code || "",
      training_provider_etqa_id: selectedBeneficiary.training_provider_etqa_id || "",
      training_provider_postal_address: selectedBeneficiary.training_provider_postal_address || "",
      training_provider_physical_address: selectedBeneficiary.training_provider_physical_address || "",
      seta_industry_funded: selectedBeneficiary.seta_industry_funded || false,
      amount_spent_per_learner: selectedBeneficiary.amount_spent_per_learner || "0",
      agreement_moa_number: selectedBeneficiary.agreement_moa_number || "",
      project_number: selectedBeneficiary.project_number || "",
      activity_number: selectedBeneficiary.activity_number || "",
      app_sub_programme: selectedBeneficiary.app_sub_programme || "",
      last_school_emis: selectedBeneficiary.last_school_emis || "",
      last_school_year: selectedBeneficiary.last_school_year || "",
      non_nqf_intervention_subfield: selectedBeneficiary.non_nqf_intervention_subfield || "",
      non_nqf_intervention_status: selectedBeneficiary.non_nqf_intervention_status || "",
      non_nqf_intervention_credit: selectedBeneficiary.non_nqf_intervention_credit || "",
      employment_status: selectedBeneficiary.employment_status || "",
      current_employer: selectedBeneficiary.current_employer || "",
      monthly_income: selectedBeneficiary.monthly_income || "0",
      skills: selectedBeneficiary.skills || "",
      notes: selectedBeneficiary.notes || "",
      beneficiary_status: selectedBeneficiary.beneficiary_status || "Current",
      id_document_url: selectedBeneficiary.id_document_url || "",
      qualification_document_url: selectedBeneficiary.qualification_document_url || ""
    });

    // Set existing documents
    setExistingDocuments({
      id_document_url: selectedBeneficiary.id_document_url || "",
      qualification_document_url: selectedBeneficiary.qualification_document_url || ""
    });

    setIdDocument(null);
    setQualificationDocument(null);
    
    setIsEdit(true);
    setOpenDialog(true);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedBeneficiary.first_name} ${selectedBeneficiary.last_name}?`)) {
      handleDeleteBeneficiary();
    }
    handleMenuClose();
  };

  const handleViewClick = (beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setOpenViewDialog(true);
  };

  const handleSave = () => {
    if (isEdit) {
      handleUpdateBeneficiary();
    } else {
      handleAddBeneficiary();
    }
  };

  const getFileNameFromUrl = (url) => {
    if (!url) return null;
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return <InsertDriveFileIcon />;
    if (fileName.toLowerCase().endsWith('.pdf')) return <PictureAsPdfIcon />;
    if (fileName.toLowerCase().endsWith('.jpg') || 
        fileName.toLowerCase().endsWith('.jpeg') || 
        fileName.toLowerCase().endsWith('.png')) return <ImageIcon />;
    return <InsertDriveFileIcon />;
  };

  const handleViewDocument = (url) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleDownloadDocument = (url) => {
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = getFileNameFromUrl(url) || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Tab panel component
  const TabPanel = ({ children, value, index }) => {
    return (
      <div hidden={value !== index}>
        {value === index && (
          <Box sx={{ p: 3 }}>
            {children}
          </Box>
        )}
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

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
          color="warning"
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
            color="warning"
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
                onClick={() => handleViewClick(beneficiary)}
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
                        bgcolor: 
                          beneficiary.beneficiary_status === 'Former' ? 'grey.500' :
                          beneficiary.status === 'Completed' ? 'success.main' :
                          beneficiary.status === 'Active' ? 'primary.main' :
                          'warning.main', 
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
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Chip 
                          label={beneficiary.beneficiary_status || "Current"} 
                          size="small" 
                          color={beneficiary.beneficiary_status === 'Former' ? 'default' : 'primary'}
                          variant="outlined"
                        />
                        <Chip 
                          label={beneficiary.status || "Active"} 
                          size="small" 
                          color={
                            beneficiary.status === 'Active' ? 'success' :
                            beneficiary.status === 'Completed' ? 'primary' :
                            'warning'
                          }
                        />
                      </Box>
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

                    {beneficiary.learner_province && (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <LocationOnIcon sx={{ mr: 1.5, fontSize: 20, color: "primary.main" }} />
                        <Typography variant="body2">
                          {beneficiary.learner_province}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                  
                  <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {beneficiary.disability && (
                      <Tooltip title={beneficiary.disability_type || "Disability"}>
                        <Chip 
                          icon={<AccessibleIcon />}
                          label="Disability" 
                          size="small" 
                          color="secondary" 
                          variant="outlined"
                        />
                      </Tooltip>
                    )}
                    {beneficiary.youth && (
                      <Chip 
                        label="Youth" 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    )}
                    {beneficiary.non_rsa_citizen && (
                      <Chip 
                        icon={<PublicIcon />}
                        label="Non-RSA" 
                        size="small" 
                        color="warning" 
                        variant="outlined"
                      />
                    )}
                    {beneficiary.race && (
                      <Chip 
                        label={beneficiary.race}
                        size="small" 
                        color="default"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  
                  {/* Document indicators */}
                  {(beneficiary.id_document_url || beneficiary.qualification_document_url) && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
                        Documents:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {beneficiary.id_document_url && (
                          <Chip
                            icon={<BadgeIcon />}
                            label="ID Document"
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        )}
                        {beneficiary.qualification_document_url && (
                          <Chip
                            icon={<DescriptionIcon />}
                            label="Qualification"
                            size="small"
                            color="info"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ADD/EDIT DIALOG */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        fullWidth 
        maxWidth="lg"
        scroll="paper"
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2, bgcolor: 'primary.main', color: 'white' }}>
          <Box>
            <Typography variant="h6" component="div" fontWeight="bold">
              {isEdit ? "Edit Beneficiary" : "Add New Beneficiary"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Project: {projectTitle}
            </Typography>
          </Box>
        </DialogTitle>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            aria-label="beneficiary form tabs"
            variant="fullWidth"
          >
            <Tab label="Personal Info" />
            <Tab label="Documents" />
            <Tab label="Programme" />
            <Tab label="Employment" />
            <Tab label="Additional" />
          </Tabs>
        </Box>
        
        <DialogContent dividers sx={{ p: 0, bgcolor: 'background.default' }}>
          {/* TAB 1: Personal Information */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name *"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  fullWidth
                  required
                  size="small"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name *"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  fullWidth
                  required
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="ID Number *"
                  value={formData.id_number}
                  onChange={(e) => handleInputChange("id_number", e.target.value)}
                  fullWidth
                  required
                  size="small"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                  helperText="Must be between 0 and 120"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">years</InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Gender *</InputLabel>
                  <Select
                    value={formData.gender}
                    onChange={(e) => handleInputChange("gender", e.target.value)}
                    label="Gender *"
                    variant="outlined"
                  >
                    <MenuItem value="">Select Gender</MenuItem>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Race</InputLabel>
                  <Select
                    value={formData.race}
                    onChange={(e) => handleInputChange("race", e.target.value)}
                    label="Race"
                    variant="outlined"
                  >
                    <MenuItem value="">Select Race</MenuItem>
                    <MenuItem value="African">African</MenuItem>
                    <MenuItem value="Coloured">Coloured</MenuItem>
                    <MenuItem value="Indian">Indian</MenuItem>
                    <MenuItem value="White">White</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Date of Birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Home Language</InputLabel>
                  <Select
                    value={formData.home_language}
                    onChange={(e) => handleInputChange("home_language", e.target.value)}
                    label="Home Language"
                    variant="outlined"
                  >
                    {languages.map((lang) => (
                      <MenuItem key={lang} value={lang}>{lang}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Initials"
                  value={formData.initials}
                  onChange={(e) => handleInputChange("initials", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Beneficiary Status</InputLabel>
                  <Select
                    value={formData.beneficiary_status}
                    onChange={(e) => handleInputChange("beneficiary_status", e.target.value)}
                    label="Beneficiary Status"
                    variant="outlined"
                  >
                    <MenuItem value="Current">Current</MenuItem>
                    <MenuItem value="Former">Former</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
              Contact Information
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Mobile Phone"
                  value={formData.mobile_phone}
                  onChange={(e) => handleInputChange("mobile_phone", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  type="email"
                  value={formData.email_address}
                  onChange={(e) => handleInputChange("email_address", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Parent/Guardian Mobile"
                  value={formData.parent_guardian_mobile}
                  onChange={(e) => handleInputChange("parent_guardian_mobile", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Parent/Guardian Email"
                  value={formData.parent_guardian_email}
                  onChange={(e) => handleInputChange("parent_guardian_email", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
              Address Information
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Province</InputLabel>
                  <Select
                    value={formData.learner_province}
                    onChange={(e) => handleInputChange("learner_province", e.target.value)}
                    label="Province"
                    variant="outlined"
                  >
                    <MenuItem value="">Select Province</MenuItem>
                    {provinces.map((province) => (
                      <MenuItem key={province} value={province}>{province}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="District Municipality"
                  value={formData.learner_district_municipality}
                  onChange={(e) => handleInputChange("learner_district_municipality", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Local Municipality"
                  value={formData.learner_local_municipality}
                  onChange={(e) => handleInputChange("learner_local_municipality", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Area Type</InputLabel>
                  <Select
                    value={formData.area_type}
                    onChange={(e) => handleInputChange("area_type", e.target.value)}
                    label="Area Type"
                    variant="outlined"
                  >
                    <MenuItem value="">Select Area Type</MenuItem>
                    <MenuItem value="Urban">Urban</MenuItem>
                    <MenuItem value="Rural">Rural</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Residential Area"
                  value={formData.residential_area}
                  onChange={(e) => handleInputChange("residential_area", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
              Demographic Information
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.youth}
                      onChange={(e) => handleInputChange("youth", e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Youth (18-35 years)"
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.disability}
                      onChange={(e) => handleInputChange("disability", e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Person with Disability"
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.non_rsa_citizen}
                      onChange={(e) => handleInputChange("non_rsa_citizen", e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Non-RSA Citizen"
                />
              </Grid>
              
              {formData.disability && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Disability Type"
                    value={formData.disability_type}
                    onChange={(e) => handleInputChange("disability_type", e.target.value)}
                    fullWidth
                    size="small"
                    variant="outlined"
                  />
                </Grid>
              )}
            </Grid>
          </TabPanel>
          
          {/* TAB 2: Document Upload */}
          <TabPanel value={activeTab} index={1}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
              Upload Documents
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Upload ID document and qualification documents. Supported formats: JPG, PNG, PDF (Max 5MB each)
            </Typography>
            
            {isUploading && (
              <Box sx={{ mb: 3 }}>
                <LinearProgress variant="determinate" value={uploadProgress} />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Uploading... {uploadProgress}%
                </Typography>
              </Box>
            )}
            
            <Grid container spacing={3}>
              {/* ID Document Upload */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary">
                    ID Document
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Upload a copy of ID document, passport, or birth certificate
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<UploadFileIcon />}
                      fullWidth
                      sx={{ mb: 2 }}
                    >
                      Upload ID Document
                      <input
                        type="file"
                        hidden
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => handleFileUpload(e, 'id')}
                      />
                    </Button>
                    
                    {idDocument && (
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.light', color: 'success.dark' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getFileIcon(idDocument.name)}
                            <Typography variant="body2" noWrap>
                              {idDocument.name}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => removeDocument('id')}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                          Size: {(idDocument.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                      </Paper>
                    )}
                    
                    {!idDocument && existingDocuments.id_document_url && (
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.light', color: 'info.dark' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getFileIcon(getFileNameFromUrl(existingDocuments.id_document_url))}
                            <Typography variant="body2">
                              Existing ID Document
                            </Typography>
                          </Box>
                          <Box>
                            <Tooltip title="View">
                              <IconButton
                                size="small"
                                onClick={() => handleViewDocument(existingDocuments.id_document_url)}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download">
                              <IconButton
                                size="small"
                                onClick={() => handleDownloadDocument(existingDocuments.id_document_url)}
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Paper>
                    )}
                  </Box>
                </Paper>
              </Grid>
              
              {/* Qualification Document Upload */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary">
                    Qualification Document
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Upload qualification certificates, diplomas, or transcripts
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<UploadFileIcon />}
                      fullWidth
                      sx={{ mb: 2 }}
                    >
                      Upload Qualification Document
                      <input
                        type="file"
                        hidden
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => handleFileUpload(e, 'qualification')}
                      />
                    </Button>
                    
                    {qualificationDocument && (
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.light', color: 'success.dark' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getFileIcon(qualificationDocument.name)}
                            <Typography variant="body2" noWrap>
                              {qualificationDocument.name}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => removeDocument('qualification')}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                          Size: {(qualificationDocument.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                      </Paper>
                    )}
                    
                    {!qualificationDocument && existingDocuments.qualification_document_url && (
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.light', color: 'info.dark' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getFileIcon(getFileNameFromUrl(existingDocuments.qualification_document_url))}
                            <Typography variant="body2">
                              Existing Qualification Document
                            </Typography>
                          </Box>
                          <Box>
                            <Tooltip title="View">
                              <IconButton
                                size="small"
                                onClick={() => handleViewDocument(existingDocuments.qualification_document_url)}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download">
                              <IconButton
                                size="small"
                                onClick={() => handleDownloadDocument(existingDocuments.qualification_document_url)}
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Paper>
                    )}
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Document Requirements
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <PictureAsPdfIcon color="error" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Accepted formats: JPG, PNG, PDF" 
                        secondary="Maximum file size: 5MB per document"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <BadgeIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="ID Document" 
                        secondary="Valid ID, passport, or birth certificate"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <DescriptionIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Qualification Document" 
                        secondary="Certificates, diplomas, transcripts, or proof of qualification"
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* TAB 3: Programme Details */}
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                  Programme Information
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Programme Type</InputLabel>
                  <Select
                    value={formData.type_of_learning_programme}
                    onChange={(e) => handleInputChange("type_of_learning_programme", e.target.value)}
                    label="Programme Type"
                    variant="outlined"
                  >
                    <MenuItem value="Training">Training</MenuItem>
                    <MenuItem value="Workshop">Workshop</MenuItem>
                    <MenuItem value="Course">Course</MenuItem>
                    <MenuItem value="Learnership">Learnership</MenuItem>
                    <MenuItem value="Internship">Internship</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleInputChange("status", e.target.value)}
                    label="Status"
                    variant="outlined"
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
                  type="date"
                  value={formData.programme_start_date}
                  onChange={(e) => handleInputChange("programme_start_date", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Programme Completion Date"
                  type="date"
                  value={formData.programme_completion_date}
                  onChange={(e) => handleInputChange("programme_completion_date", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Certificate Issue Date"
                  type="date"
                  value={formData.certificate_issue_date}
                  onChange={(e) => handleInputChange("certificate_issue_date", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Programme Outcome</InputLabel>
                  <Select
                    value={formData.programme_outcome}
                    onChange={(e) => handleInputChange("programme_outcome", e.target.value)}
                    label="Programme Outcome"
                    variant="outlined"
                  >
                    <MenuItem value="">Select Outcome</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Certified">Certified</MenuItem>
                    <MenuItem value="Not Completed">Not Completed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Divider sx={{ my: 2, width: '100%' }} />
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                  Qualification Information
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="OFO Code"
                  value={formData.ofo_code}
                  onChange={(e) => handleInputChange("ofo_code", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>NQF Level</InputLabel>
                  <Select
                    value={formData.nqf_level}
                    onChange={(e) => handleInputChange("nqf_level", e.target.value)}
                    label="NQF Level"
                    variant="outlined"
                  >
                    <MenuItem value="">Select NQF Level</MenuItem>
                    {nqfLevels.map((level) => (
                      <MenuItem key={level} value={level}>NQF {level}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Qualification ID"
                  value={formData.qualification_id}
                  onChange={(e) => handleInputChange("qualification_id", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Learnership ID"
                  value={formData.learnership_id}
                  onChange={(e) => handleInputChange("learnership_id", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Unit Standard ID"
                  value={formData.unit_standard_id}
                  onChange={(e) => handleInputChange("unit_standard_id", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Programme Description"
                  value={formData.programme_description}
                  onChange={(e) => handleInputChange("programme_description", e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  variant="outlined"
                  placeholder="Describe the programme, qualification, or training"
                />
              </Grid>
              
              <Divider sx={{ my: 2, width: '100%' }} />
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                  School Information
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last School EMIS Number"
                  value={formData.last_school_emis}
                  onChange={(e) => handleInputChange("last_school_emis", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last School Year"
                  value={formData.last_school_year}
                  onChange={(e) => handleInputChange("last_school_year", e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* TAB 4: Employment & Training */}
          <TabPanel value={activeTab} index={3}>
            {/* ... (same as before, keep this tab content) ... */}
          </TabPanel>
          
          {/* TAB 5: Additional Info */}
          <TabPanel value={activeTab} index={4}>
            {/* ... (same as before, keep this tab content) ... */}
          </TabPanel>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Cancel
          </Button>
          <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
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
              color="primary"
            >
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleSave} 
              variant="contained" 
              color="warning"
              disabled={!formData.first_name.trim() || !formData.last_name.trim() || !formData.id_number.trim() || !formData.gender.trim() || isUploading}
            >
              {isUploading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Uploading...
                </>
              ) : (
                <>
                  {isEdit ? "Update" : "Save"} Beneficiary
                </>
              )}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* VIEW BENEFICIARY DETAILS DIALOG */}
      <Dialog 
        open={openViewDialog} 
        onClose={() => setOpenViewDialog(false)} 
        fullWidth 
        maxWidth="md"
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        {selectedBeneficiary && (
          <>
            <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2, bgcolor: 'primary.main', color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ 
                  bgcolor: 'white',
                  color: 'primary.main',
                  width: 60,
                  height: 60,
                  fontSize: '1.8rem',
                  fontWeight: 'bold'
                }}>
                  {selectedBeneficiary.first_name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h5" component="div" fontWeight="bold">
                    {selectedBeneficiary.first_name} {selectedBeneficiary.last_name}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    ID: {selectedBeneficiary.id_number} • 
                    Project: {projectTitle}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            
            <DialogContent dividers>
              <Tabs value={0} variant="fullWidth" sx={{ mb: 3 }}>
                <Tab label="Overview" />
                <Tab label="Documents" />
              </Tabs>
              
              {/* Overview Tab */}
              <Box hidden={false}>
                <Grid container spacing={3}>
                  {/* ... (keep the overview content from before) ... */}
                </Grid>
              </Box>
              
              {/* Documents Tab */}
              <Box hidden={true}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                  Uploaded Documents
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  {/* ID Document */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BadgeIcon color="primary" />
                          <Typography variant="subtitle2" fontWeight="bold">
                            ID Document
                          </Typography>
                        </Box>
                        {selectedBeneficiary.id_document_url && (
                          <Box>
                            <Tooltip title="View Document">
                              <IconButton
                                onClick={() => handleViewDocument(selectedBeneficiary.id_document_url)}
                                sx={{ mr: 1 }}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download Document">
                              <IconButton
                                onClick={() => handleDownloadDocument(selectedBeneficiary.id_document_url)}
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </Box>
                      
                      {selectedBeneficiary.id_document_url ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                          {getFileIcon(getFileNameFromUrl(selectedBeneficiary.id_document_url))}
                          <Typography variant="body2">
                            {getFileNameFromUrl(selectedBeneficiary.id_document_url)}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          No ID document uploaded
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                  
                  {/* Qualification Document */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DescriptionIcon color="primary" />
                          <Typography variant="subtitle2" fontWeight="bold">
                            Qualification Document
                          </Typography>
                        </Box>
                        {selectedBeneficiary.qualification_document_url && (
                          <Box>
                            <Tooltip title="View Document">
                              <IconButton
                                onClick={() => handleViewDocument(selectedBeneficiary.qualification_document_url)}
                                sx={{ mr: 1 }}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download Document">
                              <IconButton
                                onClick={() => handleDownloadDocument(selectedBeneficiary.qualification_document_url)}
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </Box>
                      
                      {selectedBeneficiary.qualification_document_url ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                          {getFileIcon(getFileNameFromUrl(selectedBeneficiary.qualification_document_url))}
                          <Typography variant="body2">
                            {getFileNameFromUrl(selectedBeneficiary.qualification_document_url)}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          No qualification document uploaded
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            
            <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
              <Button onClick={() => setOpenViewDialog(false)} color="inherit">
                Close
              </Button>
              <Button 
                onClick={() => {
                  setOpenViewDialog(false);
                  handleEditClick();
                }}
                variant="contained"
                color="warning"
              >
                Edit Beneficiary
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

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