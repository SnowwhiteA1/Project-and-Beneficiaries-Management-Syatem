import React from "react";
import { Button, TextField, Container, Typography, Box, Link } from "@mui/material";

function Login() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 10, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="h4" align="center">
          Admin Login
        </Typography>
        <TextField label="Email" variant="outlined" fullWidth />
        <TextField label="Password" type="password" variant="outlined" fullWidth />
        <Button variant="contained" color="primary">
          Login
        </Button>
        <Link href="#" variant="body2" align="center">
          Forgot Password?
        </Link>
      </Box>
    </Container>
  );
}

export default Login;
