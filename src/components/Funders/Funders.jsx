import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";

function Funders() {
  const funders = [
    { name: "BankSeta", programs: "Internship", participants: 27 },
  ];

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Programs Funded</TableCell>
            <TableCell>Participants</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {funders.map((f, index) => (
            <TableRow key={index}>
              <TableCell>{f.name}</TableCell>
              <TableCell>{f.programs}</TableCell>
              <TableCell>{f.participants}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default Funders;
