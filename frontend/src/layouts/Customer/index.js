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
import FolderIcon from "@mui/icons-material/Folder";
import { CheckCircle } from "@mui/icons-material";

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

  // Create modal state
  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

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

  // Fetch projects and update statuses via events
  useEffect(() => {
    if (!account) return;

    const load = async () => {
      const sys = systemContract();

      // Created
      const created = await sys.getPastEvents("ProjectCreated", {
        filter: { owner: account },
        fromBlock: 0,
        toBlock: "latest",
      });
      let items = created.map((ev) => ({
        id: ev.returnValues.projectId,
        metadata: JSON.parse(ev.returnValues.metadataURI),
        status: "Created",
        credits: 0,
      }));

      // Requested
      const reqs = await sys.getPastEvents("ValidationRequested", {
        fromBlock: 0,
        toBlock: "latest",
      });
      const reqSet = new Set(reqs.map((ev) => ev.returnValues.projectId));
      items = items.map((p) => ({ ...p, status: reqSet.has(p.id) ? "UnderReview" : p.status }));

      // Finalized
      const finals = await sys.getPastEvents("ValidationFinalized", {
        fromBlock: 0,
        toBlock: "latest",
      });
      const creditMap = finals.reduce((m, ev) => {
        m[ev.returnValues.projectId] = ev.returnValues.finalCredits;
        return m;
      }, {});
      items = items.map((p) => ({
        ...p,
        status: creditMap[p.id] != null ? "Finalized" : p.status,
        credits: creditMap[p.id] || 0,
      }));

      setProjects(items);
    };

    load().catch(console.error);
  }, [account]);

  // Request validation
  const handleRequestValidation = async (id) => {
    try {
      const sys = systemContract();
      await sys.methods.requestValidation(id).send({ from: account });
      setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, status: "UnderReview" } : p)));
    } catch (err) {
      console.error(err);
      alert("Error requesting validation: " + err.message);
    }
  };

  // Finalize validation
  const handleFinalize = async (id) => {
    try {
      const sys = systemContract();
      await sys.methods.finalizeValidation(id).send({ from: account });
      setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, status: "Finalized" } : p)));
      alert(`Project #${id} finalized.`);
    } catch (err) {
      console.error(err);
      alert("Error finalizing: " + err.message);
    }
  };

  // Create project
  const openCreateModal = () => setOpenCreate(true);
  const closeCreateModal = () => {
    setOpenCreate(false);
    setName("");
    setDescription("");
    setLocation("");
  };
  const handleCreate = async () => {
    try {
      const sys = systemContract();
      const uri = JSON.stringify({ name, description, location });
      const gas = await sys.methods.createProject(uri).estimateGas({ from: account });
      const tx = await sys.methods.createProject(uri).send({ from: account, gas });
      const ev = tx.events.ProjectCreated.returnValues;
      setProjects((prev) => [
        ...prev,
        {
          id: ev.projectId,
          metadata: { name, description, location },
          status: "Created",
          credits: 0,
        },
      ]);
      closeCreateModal();
    } catch (err) {
      console.error(err);
      alert("Error creating project: " + err.message);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3} px={4}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <MDTypography variant="h4" fontWeight="medium">
              My Carbon Projects
            </MDTypography>
          </Grid>
          <Grid item>
            {account ? (
              <>
                <Typography variant="body2" mr={2}>
                  Connected: {account}
                </Typography>
                <Button color="primary" variant="contained" onClick={openCreateModal}>
                  Create Project
                </Button>
              </>
            ) : (
              <Button color="primary" variant="contained" onClick={handleConnect}>
                Connect Wallet
              </Button>
            )}
          </Grid>
        </Grid>

        <MDBox mt={4}>
          {projects.length === 0 ? (
            <Typography>No projects yet.</Typography>
          ) : (
            <Grid container spacing={3}>
              {projects.map((p) => (
                <Grid key={p.id} item xs={12} sm={6} md={4}>
                  <Card>
                    <CardContent sx={{ display: "flex", alignItems: "center" }}>
                      <FolderIcon sx={{ mr: 1 }} />
                      <Typography variant="h6">{p.metadata.name}</Typography>
                    </CardContent>
                    <CardContent>
                      <Typography variant="body2" color="textSecondary">
                        {p.metadata.description}
                      </Typography>
                      <Typography variant="caption" display="block" mt={1}>
                        Location: {p.metadata.location}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        disabled={p.status !== "Created"}
                        onClick={() => handleRequestValidation(p.id)}
                      >
                        Request Validation
                      </Button>
                      <Button
                        size="small"
                        startIcon={<CheckCircle />}
                        disabled={p.status !== "UnderReview"}
                        color={p.status === "Finalized" ? "error" : "success"}
                        onClick={() => handleFinalize(p.id)}
                      >
                        {p.status === "Finalized" ? `Done (${p.credits} credits)` : "Finalize"}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </MDBox>

        {/* Create Project Modal */}
        <Dialog open={openCreate} onClose={closeCreateModal} fullWidth maxWidth="sm">
          <DialogTitle>Create New Project</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              margin="normal"
              label="Name"
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
            <Button onClick={closeCreateModal}>Cancel</Button>
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
      </MDBox>
    </DashboardLayout>
  );
}
