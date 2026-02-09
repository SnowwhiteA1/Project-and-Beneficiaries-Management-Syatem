import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
  Avatar,
  TextField,
  Link
} from "@mui/material";

const companyLogo = "/logo.jpeg";

const Login = ({ onLogin }) => {  // Add onLogin as a prop here
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    // Add login logic here
    console.log("Login attempt with:", { email, password });
    
    // Call the onLogin prop to switch to dashboard
    if (onLogin) {
      onLogin();
    }
  };

  return (
    <Box sx={{ 
      p: 4, 
      bgcolor: "white", 
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>
      {/* Header - Same as dashboard */}
      <Box sx={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        width: "100%",
        maxWidth: 1200
      }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "black", mb:1 }}>
          JumpStart Your Career (NPO)
        </Typography>
        <Avatar alt="Company Logo" src={companyLogo} sx={{ width: 120, height: 80}} />
      </Box>

      <Divider sx={{ 
        borderBottomWidth: 2, 
        bgcolor: "black", 
        mb: 2, 
        width: "100%",
        maxWidth: 1200 
      }} />

      
            {/* Title */}
            <Typography variant="h5" sx={{ textAlign: "center", fontWeight: "bold", color: "primary", mb: 3 }}>
              Projects and Beneficiary Management System
            </Typography>

      {/* Login Card */}
      <Card sx={{
        border: "2px solid black",
        bgcolor: "white",
        borderRadius: 3,
        width: "100%",
        maxWidth: 400,
        p: 3
      }}>
        <CardContent>
          {/* Login Title */}
          <Typography 
            variant="h5" 
            sx={{ 
              textAlign: "center", 
              fontWeight: "bold", 
              color: "black", 
              mb: 3 
            }}
          >
            Login to Your Account
          </Typography>

          {/* Login Form */}
          <Box component="form" onSubmit={handleLogin} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Email Field */}
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "black",
                  },
                  "&:hover fieldset": {
                    borderColor: "black",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "warning.main",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "black",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "warning.main",
                },
              }}
            />

            {/* Password Field */}
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "black",
                  },
                  "&:hover fieldset": {
                    borderColor: "black",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "warning.main",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "black",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "warning.main",
                },
              }}
            />

            {/* Forgot Password Link */}
            <Box sx={{ textAlign: "right" }}>
              <Link 
                href="#" 
                sx={{ 
                  color: "warning.main",
                  textDecoration: "none",
                  "&:hover": {
                    textDecoration: "underline",
                  }
                }}
              >
                Forgot your password?
              </Link>
            </Box>

            {/* Login Button */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ 
                bgcolor: "warning.main", 
                color: "black", 
                "&:hover": { 
                  bgcolor: "warning.dark" 
                },
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: "bold"
              }}
            >
              Login
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Typography 
        variant="body2" 
        sx={{ 
          mt: 3, 
          color: "black",
          textAlign: "center",
          maxWidth: 400
        }}
      >
        Don't have an account? Please contact your administrator.
      </Typography>
    </Box>
  );
};

export default Login;