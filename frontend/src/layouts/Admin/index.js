// src/layouts/dashboard/CreateProject.js

import React, { useState, useEffect } from "react";
// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import { PersonAdd, CheckCircle } from "@mui/icons-material";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Layout
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Ethereum helpers
import { initWeb3, getAccounts, systemContract } from "../../ethereum";

export default function Admin() {
  const [account, setAccount] = useState("");
  const [projects, setProjects] = useState([]);
  const [validators, setValidators] = useState([]);
  const [newValidator, setNewValidator] = useState("");

  // Create form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  // Update form state
  const [updateOpen, setUpdateOpen] = useState(false);
  const [currentId, setCurrentId] = useState("");
  const [updateName, setUpdateName] = useState("");
  const [updateDescription, setUpdateDescription] = useState("");
  const [updateLocation, setUpdateLocation] = useState("");

  // Connect wallet
  const handleConnect = async () => {
    try {
      await initWeb3();
      const [acct] = await getAccounts();
      setAccount(acct);
    } catch (err) {
      console.error("Wallet connection failed", err);
      alert("Failed to connect wallet: " + err.message);
    }
  };

  // Fetch user's projects via events
  useEffect(() => {
    if (!account) return;
    const fetchProjects = async () => {
      try {
        const sys = systemContract();
        const events = await sys.getPastEvents("ProjectCreated", {
          filter: { owner: account },
          fromBlock: 0,
          toBlock: "latest",
        });
        setProjects(
          events.map((ev) => ({
            id: ev.returnValues.projectId,
            metadata: JSON.parse(ev.returnValues.metadataURI),
          }))
        );
      } catch (err) {
        console.error("Error fetching projects", err);
      }
    };
    const fetchValidators = async () => {
      try {
        const sys = systemContract();
        const events = await sys.getPastEvents("ValidatorAdded", {
          fromBlock: 0,
          toBlock: "latest",
        });
        setValidators(events.map((ev) => ev.returnValues.validator));
      } catch (err) {
        console.error("Error fetching validators", err);
      }
    };
    fetchProjects();
    fetchValidators();
  }, [account]);

  // Handlers for create modal
  const openCreate = () => setCreateOpen(true);
  const closeCreate = () => {
    setCreateOpen(false);
    setName("");
    setDescription("");
    setLocation("");
  };
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name || !description || !location) return;
    try {
      const sys = systemContract();
      const uri = JSON.stringify({ name, description, location });
      const gas = await sys.methods.createProject(uri).estimateGas({ from: account });
      const tx = await sys.methods.createProject(uri).send({ from: account, gas });
      const ev = tx.events.ProjectCreated.returnValues;
      setProjects((prev) => [
        ...prev,
        { id: ev.projectId, metadata: { name, description, location } },
      ]);
      closeCreate();
    } catch (err) {
      console.error(err);
      alert("Error creating project: " + err.message);
    }
  };

  // Handlers for update modal
  const openUpdate = (proj) => {
    setCurrentId(proj.id);
    setUpdateName(proj.metadata.name);
    setUpdateDescription(proj.metadata.description);
    setUpdateLocation(proj.metadata.location);
    setUpdateOpen(true);
  };
  const closeUpdate = () => {
    setUpdateOpen(false);
    setCurrentId("");
    setUpdateName("");
    setUpdateDescription("");
    setUpdateLocation("");
  };
  const handleUpdateSave = async () => {
    try {
      const sys = systemContract();
      const newUri = JSON.stringify({
        name: updateName,
        description: updateDescription,
        location: updateLocation,
      });
      const gas = await sys.methods.updateProject(currentId, newUri).estimateGas({ from: account });
      await sys.methods.updateProject(currentId, newUri).send({ from: account, gas });
      setProjects((prev) =>
        prev.map((p) =>
          p.id === currentId
            ? {
                id: p.id,
                metadata: {
                  name: updateName,
                  description: updateDescription,
                  location: updateLocation,
                },
              }
            : p
        )
      );
      closeUpdate();
    } catch (err) {
      console.error(err);
      alert("Error updating project: " + err.message);
    }
  };

  // Add validator handler
  const handleAddValidator = async () => {
    if (!newValidator) return;
    try {
      const sys = systemContract();
      await sys.methods.addValidator(newValidator).send({ from: account });
      setValidators((prev) => [...prev, newValidator]);
      setNewValidator("");
      alert(`Validator ${newValidator} added`);
    } catch (err) {
      console.error(err);
      alert("Error adding validator: " + err.message);
    }
  };

  // Finalize validation handler
  const handleFinalizeValidation = async (id) => {
    try {
      const sys = systemContract();
      await sys.methods.finalizeValidation(id).send({ from: account });
      alert(`Validation finalized for project #${id}`);
    } catch (err) {
      console.error(err);
      alert("Error finalizing validation: " + err.message);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3} px={4}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <MDTypography variant="h4" fontWeight="medium">
              My Carbon Projects & Validators
            </MDTypography>
          </Grid>
          <Grid item>
            {account ? (
              <Button variant="contained" color="primary" onClick={openCreate}>
                Create Project
              </Button>
            ) : (
              <Button variant="contained" color="primary" onClick={handleConnect}>
                Connect Wallet
              </Button>
            )}
          </Grid>
        </Grid>

        {/* Validators Section */}
        <MDBox mt={4}>
          <MDTypography variant="h5" gutterBottom>
            Current Validators
          </MDTypography>
          <Box display="flex" alignItems="center" mb={2}>
            <TextField
              variant="outlined"
              size="small"
              label="Validator Address"
              value={newValidator}
              onChange={(e) => setNewValidator(e.target.value)}
              style={{ marginRight: 8 }}
            />
            <Button variant="contained" startIcon={<PersonAdd />} onClick={handleAddValidator}>
              Add Validator
            </Button>
          </Box>
          <Grid container spacing={2}>
            {validators.map((val) => (
              <Grid key={val} item>
                <Card>
                  <CardContent style={{ display: "flex", alignItems: "center" }}>
                    <Avatar sx={{ mr: 2 }}>
                      <PersonAdd />
                    </Avatar>
                    <Typography variant="body2">{val}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </MDBox>

        {/* Projects grid */}
        <MDBox mt={6}>
          <MDTypography variant="h5" gutterBottom>
            Current Projects
          </MDTypography>
          <Grid container spacing={3}>
            {projects.length === 0 ? (
              <Grid item xs={12}>
                <Typography>No projects found.</Typography>
              </Grid>
            ) : (
              projects.map((proj) => (
                <Grid key={proj.id} item xs={12} sm={6} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">
                        #{proj.id}: {proj.metadata.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {proj.metadata.description}
                      </Typography>
                      <Typography variant="caption" display="block" mt={1}>
                        Location: {proj.metadata.location}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" onClick={() => openUpdate(proj)}>
                        Update
                      </Button>
                      <Button size="small" onClick={() => handleRequestValidation(proj.id)}>
                        Request Validation
                      </Button>
                      <Button
                        size="small"
                        startIcon={<CheckCircle />}
                        onClick={() => handleFinalizeValidation(proj.id)}
                      >
                        Finalize
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </MDBox>

        {/* Create Modal */}
        <Dialog open={createOpen} onClose={closeCreate} fullWidth maxWidth="sm">
          <DialogTitle>Create New Project</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              margin="normal"
              label="Project Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Description"
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeCreate}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={!name || !description || !location}
              variant="contained"
              color="primary"
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Update Modal */}
        <Dialog open={updateOpen} onClose={closeUpdate} fullWidth maxWidth="sm">
          <DialogTitle>Update Project #{currentId}</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              margin="normal"
              label="Project Name"
              value={updateName}
              onChange={(e) => setUpdateName(e.target.value)}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Description"
              multiline
              rows={3}
              value={updateDescription}
              onChange={(e) => setUpdateDescription(e.target.value)}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Location"
              value={updateLocation}
              onChange={(e) => setUpdateLocation(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeUpdate}>Cancel</Button>
            <Button
              onClick={handleUpdateSave}
              disabled={!updateName || !updateDescription || !updateLocation}
              variant="contained"
              color="primary"
            >
              Update
            </Button>
          </DialogActions>
        </Dialog>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}
