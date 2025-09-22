import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from "@mui/material";

function Participants() {
  const participants = [
    { name: "Bongile", surname: "Gama", dob: "02-02-20", sex: "F", accreditor: "Not Accredited" },
    { name: "Lesedi", surname: "Ndlovu", dob: "02-03-29", sex: "M", accreditor: "MICSETA" },
  ];

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Surname</TableCell>
            <TableCell>Date of Birth</TableCell>
            <TableCell>Sex</TableCell>
            <TableCell>Accreditor</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {participants.map((p, index) => (
            <TableRow key={index}>
              <TableCell>{p.name}</TableCell>
              <TableCell>{p.surname}</TableCell>
              <TableCell>{p.dob}</TableCell>
              <TableCell>{p.sex}</TableCell>
              <TableCell>{p.accreditor}</TableCell>
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

export default Participants;
