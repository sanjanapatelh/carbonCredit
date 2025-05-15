// src/layouts/dashboard/CreateProject.js

import React, { useState, useEffect } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Layout
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Ethereum helpers
import { initWeb3, getAccounts, systemContract } from "../../ethereum";

function CreateProject() {
  // form state
  const [account, setAccount] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  // initialize web3 + account
  useEffect(() => {
    async function setup() {
      await initWeb3();
      const [acct] = getAccounts();
      setAccount(acct);
    }
    setup();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    // simple validation
    if (!name || !description || !location) {
      return alert("Please fill in all fields");
    }

    // build a JSON metadata object
    const metadata = { name, description, location };
    // in a production app you'd upload to IPFS and pass the URI instead!
    const metadataURI = JSON.stringify(metadata);

    try {
      const sys = systemContract();
      const tx = await sys.methods.createProject(metadataURI).send({ from: account });
      const event = tx.events.ProjectCreated.returnValues;
      alert(`Project #${event.projectId} created by ${event.owner}`);
      // clear form
      setName("");
      setDescription("");
      setLocation("");
    } catch (err) {
      console.error(err);
      alert("Error creating project:\n" + err.message);
    }
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container justifyContent="center">
          <Grid item xs={12} lg={6}>
            <Card>
              <MDBox p={2}>
                <MDTypography variant="h5" fontWeight="medium">
                  New Carbon Project
                </MDTypography>
                <MDTypography variant="body2" color="text">
                  Connected account: {account || "—"}
                </MDTypography>
              </MDBox>

              <MDBox component="form" p={2} onSubmit={handleCreate}>
                <TextField
                  fullWidth
                  label="Project Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  margin="normal"
                  multiline
                  rows={3}
                />
                <TextField
                  fullWidth
                  label="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  margin="normal"
                />

                <MDBox mt={2} textAlign="right">
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={!account || !name || !description || !location}
                  >
                    Create Project
                  </Button>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}

export default CreateProject;
