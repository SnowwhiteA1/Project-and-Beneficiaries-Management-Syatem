import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from "@mui/material";

function Projects() {
  const projects = [
    { title: "BankSeta Internship", type: "Internship", startDate: "01-09-2025", endDate: "30-11-2025", status: "Ongoing" },
  ];

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Start Date</TableCell>
            <TableCell>End Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {projects.map((p, index) => (
            <TableRow key={index}>
              <TableCell>{p.title}</TableCell>
              <TableCell>{p.type}</TableCell>
              <TableCell>{p.startDate}</TableCell>
              <TableCell>{p.endDate}</TableCell>
              <TableCell>{p.status}</TableCell>
              <TableCell>
                <Button variant="outlined" color="primary">Edit</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default Projects;
