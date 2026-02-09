import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InsertChartIcon from '@mui/icons-material/InsertChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import TableChartIcon from '@mui/icons-material/TableChart';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const API_BASE = "http://localhost:5050";
const PROJECTS_API = `${API_BASE}/api/projects`;
const ANALYTICS_API = `${API_BASE}/api/analytics`;

// Use the same lists from Dashboard for consistency
const ACCREDITORS_LIST = ["MICSETA", "QASA"]; 
const FUNDERS_LIST = ["BankSeta", "Fasset", "Social Development", "Private Donor"]; 
const PROJECT_TYPES = ["Training", "Learnership", "Internship", "Mentorship", "Research"]; 
const STATUS_OPTIONS = ["Active", "Completed", "Planning", "On Hold"];

// Simple bar chart component (no Recharts dependency)
const SimpleBarChart = ({ data, title, colors }) => {
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <Box sx={{ height: 300, p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>{title}</Typography>
      <Box sx={{ height: 250, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        {data.map((item, index) => (
          <Box key={item.name} sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" sx={{ width: 100 }}>{item.name}</Typography>
              <Typography variant="caption" sx={{ ml: 1 }}>{item.value}</Typography>
            </Box>
            <Box 
              sx={{ 
                height: 20, 
                width: `${(item.value / maxValue) * 100}%`, 
                bgcolor: colors[index % colors.length],
                borderRadius: 1
              }} 
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// Simple pie chart component
const SimplePieChart = ({ data, title, colors }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <Box sx={{ height: 300, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="subtitle1" gutterBottom>{title}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
        <Box sx={{ position: 'relative', width: 150, height: 150 }}>
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const startAngle = index === 0 ? 0 : 
              data.slice(0, index).reduce((sum, d) => sum + (d.value / total) * 360, 0);
            
            return (
              <Box
                key={item.name}
                sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: `conic-gradient(
                    ${colors[index % colors.length]} 0% ${percentage}%,
                    transparent ${percentage}% 100%
                  )`,
                  clipPath: `circle(50% at 50% 50%)`,
                }}
              />
            );
          })}
        </Box>
      </Box>
      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
        {data.map((item, index) => (
          <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                bgcolor: colors[index % colors.length],
                mr: 1,
                borderRadius: 1
              }} 
            />
            <Typography variant="caption">
              {item.name}: {item.value} ({((item.value / total) * 100).toFixed(1)}%)
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartView, setChartView] = useState('types'); // 'types', 'status', 'funders'
  const [projectTypeFilter, setProjectTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [funderFilter, setFunderFilter] = useState('all');
  const [chartType, setChartType] = useState('bar'); // 'pie', 'bar'
  
  const navigate = useNavigate();
  const reportRef = useRef();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      console.log("Fetching analytics from:", `${ANALYTICS_API}/projects`);
      
      // First test if backend is reachable
      const healthCheck = await axios.get(`${API_BASE}/api/health`);
      console.log("Health check:", healthCheck.data);
      
      // Try to get analytics - if fails, use fallback data
      try {
        const res = await axios.get(`${ANALYTICS_API}/projects`);
        console.log("Analytics data received");
        setAnalyticsData(res.data);
      } catch (analyticsErr) {
        console.warn("Analytics endpoint failed, using fallback:", analyticsErr.message);
        // Create fallback data from projects
        const projectsRes = await axios.get(PROJECTS_API);
        const projects = projectsRes.data;
        const fallbackData = createFallbackAnalytics(projects);
        setAnalyticsData(fallbackData);
      }
      
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError('Failed to fetch analytics data. Please ensure backend is running on port 5050.');
    } finally {
      setLoading(false);
    }
  };

  const createFallbackAnalytics = (projects) => {
    // Calculate distributions manually
    const typeDistribution = {};
    const statusDistribution = {};
    const funderDistribution = {};
    
    projects.forEach(project => {
      // Type distribution
      typeDistribution[project.project_type] = (typeDistribution[project.project_type] || 0) + 1;
      
      // Status distribution
      statusDistribution[project.status] = (statusDistribution[project.status] || 0) + 1;
      
      // Funder distribution
      const funder = project.funder || 'No Funder';
      funderDistribution[funder] = (funderDistribution[funder] || 0) + 1;
    });
    
    return {
      summary: {
        total_projects: projects.length,
        active_projects: statusDistribution['Active'] || 0,
        completed_projects: statusDistribution['Completed'] || 0,
        completion_rate: projects.length > 0 ? 
          Math.round(((statusDistribution['Completed'] || 0) / projects.length) * 100) : 0,
        unique_project_types: Object.keys(typeDistribution).length,
        unique_funders: Object.keys(funderDistribution).length - (funderDistribution['No Funder'] ? 1 : 0)
      },
      distributions: {
        by_type: typeDistribution,
        by_status: statusDistribution,
        by_funder: funderDistribution
      },
      charts: {
        type_data: Object.entries(typeDistribution).map(([name, value]) => ({ name, value })),
        status_data: Object.entries(statusDistribution).map(([name, value]) => ({ name, value })),
        funder_data: Object.entries(funderDistribution).map(([name, value]) => ({ name, value }))
      }
    };
  };

  // Colors for charts
  const TYPE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  const STATUS_COLORS = {
    'Active': '#4CAF50',
    'Completed': '#2196F3',
    'Planning': '#FF9800',
    'On Hold': '#F44336'
  };
  const FUNDER_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const getChartData = () => {
    if (!analyticsData) return [];
    
    switch (chartView) {
      case 'types':
        return analyticsData.charts.type_data || [];
      case 'status':
        return analyticsData.charts.status_data || [];
      case 'funders':
        return analyticsData.charts.funder_data || [];
      default:
        return analyticsData.charts.type_data || [];
    }
  };

  const getChartColors = () => {
    switch (chartView) {
      case 'types':
        return TYPE_COLORS;
      case 'status':
        return (analyticsData?.charts.status_data || []).map(item => 
          STATUS_COLORS[item.name] || '#8884D8'
        );
      case 'funders':
        return FUNDER_COLORS;
      default:
        return TYPE_COLORS;
    }
  };

  const getChartTitle = () => {
    switch (chartView) {
      case 'types':
        return 'Project Type Distribution';
      case 'status':
        return 'Project Status Distribution';
      case 'funders':
        return 'Funder Distribution';
      default:
        return 'Analytics Overview';
    }
  };

  const currentChartData = getChartData();
  const currentChartColors = getChartColors();

  const exportToPDF = async () => {
    try {
      const input = reportRef.current;
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const pageHeight = pdf.internal.pageSize.height;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`projects-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!analyticsData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No analytics data available</Alert>
        <Button onClick={fetchAnalytics} sx={{ mt: 2 }}>Retry</Button>
      </Box>
    );
  }

  const { summary, distributions } = analyticsData;

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={handleBackToDashboard}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="primary">
              Project Analytics Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Insights based on Project Types, Status, and Funders
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAnalytics}
          >
            Refresh Data
          </Button>
          <Tooltip title="Export as PDF Report">
            <Button
              variant="contained"
              startIcon={<PictureAsPdfIcon />}
              onClick={exportToPDF}
              color="secondary"
            >
              Export PDF
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Report content for PDF export */}
      <div ref={reportRef} style={{ backgroundColor: 'white', padding: '20px' }}>
        {/* PDF Header */}
        <Box sx={{ textAlign: 'center', mb: 4, borderBottom: '2px solid #1976d2', pb: 2 }}>
          <Typography variant="h4" color="primary" fontWeight="bold">
            JumpStart Your Career (NPO)
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Project Analytics Report
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </Typography>
        </Box>


        {/* Chart Selection */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight="bold">
            {getChartTitle()}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ToggleButtonGroup
              value={chartView}
              exclusive
              onChange={(e, newView) => newView && setChartView(newView)}
              size="small"
            >
              <ToggleButton value="types" sx={{ minWidth: 100 }}>
                By Type
              </ToggleButton>
              <ToggleButton value="status" sx={{ minWidth: 100 }}>
                By Status
              </ToggleButton>
              <ToggleButton value="funders" sx={{ minWidth: 100 }}>
                By Funder
              </ToggleButton>
            </ToggleButtonGroup>
            
            <ToggleButtonGroup
              value={chartType}
              exclusive
              onChange={(e, newType) => newType && setChartType(newType)}
              size="small"
            >
              <ToggleButton value="pie">
                <PieChartIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="bar">
                <InsertChartIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Main Chart */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 2, minHeight: 400 }}>
          {currentChartData.length > 0 ? (
            chartType === 'pie' ? (
              <SimplePieChart 
                data={currentChartData}
                title={getChartTitle()}
                colors={currentChartColors}
              />
            ) : (
              <SimpleBarChart 
                data={currentChartData}
                title={getChartTitle()}
                colors={currentChartColors}
              />
            )
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 350 }}>
              <Typography variant="h6" color="text.secondary">
                No data available for the selected filters
              </Typography>
            </Box>
          )}
          
          {/* Data Summary */}
          <Box sx={{ mt: 3, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Data Summary:
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  <strong>Total Projects:</strong> {summary.total_projects}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  <strong>Completion Rate:</strong> {summary.completion_rate}%
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  <strong>Filter Applied:</strong> {
                    [projectTypeFilter, statusFilter, funderFilter]
                      .filter(f => f !== 'all')
                      .join(', ') || 'None'
                  }
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Detailed Data Tables */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Project Types Table */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 1, height: '100%' }}>
              <Typography variant="h6" gutterBottom color="primary">
                By Project Type
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Count</TableCell>
                      <TableCell align="right">%</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(distributions.by_type || {}).map(([type, count], index) => (
                      <TableRow key={type}>
                        <TableCell>
                          <Chip 
                            label={type} 
                            size="small" 
                            sx={{ 
                              bgcolor: TYPE_COLORS[index % TYPE_COLORS.length],
                              color: 'white'
                            }} 
                          />
                        </TableCell>
                        <TableCell align="right">{count}</TableCell>
                        <TableCell align="right">
                          {summary.total_projects > 0 ? ((count / summary.total_projects) * 100).toFixed(1) : 0}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Status Table */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 1, height: '100%' }}>
              <Typography variant="h6" gutterBottom color="primary">
                By Status
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Count</TableCell>
                      <TableCell align="right">%</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(distributions.by_status || {}).map(([status, count]) => (
                      <TableRow key={status}>
                        <TableCell>
                          <Chip 
                            label={status} 
                            size="small" 
                            sx={{ 
                              bgcolor: STATUS_COLORS[status] || '#e0e0e0',
                              color: 'white'
                            }} 
                          />
                        </TableCell>
                        <TableCell align="right">{count}</TableCell>
                        <TableCell align="right">
                          {summary.total_projects > 0 ? ((count / summary.total_projects) * 100).toFixed(1) : 0}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Funders Table */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 1, height: '100%' }}>
              <Typography variant="h6" gutterBottom color="primary">
                By Funder
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Funder</TableCell>
                      <TableCell align="right">Count</TableCell>
                      <TableCell align="right">%</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(distributions.by_funder || {}).map(([funder, count], index) => (
                      <TableRow key={funder}>
                        <TableCell>{funder}</TableCell>
                        <TableCell align="right">{count}</TableCell>
                        <TableCell align="right">
                          {summary.total_projects > 0 ? ((count / summary.total_projects) * 100).toFixed(1) : 0}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Report Footer */}
        <Box sx={{ mt: 4, pt: 2, borderTop: '2px solid #e0e0e0' }}>
          <Typography variant="body2" color="text.secondary" align="center">
            Report ID: {Math.random().toString(36).substr(2, 9).toUpperCase()} | 
            Generated by JumpStart Analytics System | 
            For internal use only
          </Typography>
        </Box>
      </div>

      {/* Additional export note */}
      <Box sx={{ mt: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
        <Typography variant="body2" align="center">
          Click "Export PDF" to download a printable report of all analytics shown above.
        </Typography>
      </Box>
    </Box>
  );
};

export default Analytics;