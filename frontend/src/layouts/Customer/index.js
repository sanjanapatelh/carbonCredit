// src/layouts/dashboard/Admin.js

import React, { useState, useEffect, useCallback } from "react";
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

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import { initWeb3, getAccounts, systemContract } from "../../ethereum";

export default function Admin() {
  const [account, setAccount] = useState("");
  const [projects, setProjects] = useState([]);

  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  // Load account and projects
  const loadAccountAndProjects = useCallback(async () => {
    try {
      await initWeb3();
      const accts = await getAccounts();
      if (accts.length === 0) {
        setAccount("");
        setProjects([]);
        return;
      }
      const acct = accts[0];
      setAccount(acct);
      await loadProjects(acct);
    } catch (err) {
      console.error("init failed", err);
    }
  }, []);

  // Load projects for a given account
  const loadProjects = async (acct) => {
    const sys = systemContract();

    // 1) ProjectCreated
    const created = await sys.getPastEvents("ProjectCreated", {
      fromBlock: 0,
      toBlock: "latest",
    });
    let items = created
      .filter((ev) => ev.returnValues.owner.toLowerCase() === acct.toLowerCase())
      .map((ev) => {
        let meta = { name: "", description: "", location: "" };
        try {
          meta = JSON.parse(ev.returnValues.metadataURI);
        } catch {}
        return {
          id: Number(ev.returnValues.projectId),
          metadata: meta,
          status: "Created",
          credits: 0,
        };
      });

    // 2) ValidationRequested
    const reqs = await sys.getPastEvents("ValidationRequested", {
      fromBlock: 0,
      toBlock: "latest",
    });
    const underReview = new Set(reqs.map((ev) => Number(ev.returnValues.projectId)));
    items = items.map((p) => ({
      ...p,
      status: underReview.has(p.id) ? "UnderReview" : p.status,
    }));

    // 3) ValidationFinalized
    const finals = await sys.getPastEvents("ValidationFinalized", {
      fromBlock: 0,
      toBlock: "latest",
    });
    const creditMap = finals.reduce((map, ev) => {
      map[Number(ev.returnValues.projectId)] = Number(ev.returnValues.finalCredits);
      return map;
    }, {});
    items = items.map((p) => ({
      ...p,
      status: creditMap[p.id] != null ? "Finalized" : p.status,
      credits: creditMap[p.id] || 0,
    }));

    setProjects(items);
  };

  // On mount: load account & projects, and listen for account changes
  useEffect(() => {
    loadAccountAndProjects();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", () => {
        loadAccountAndProjects();
      });
    }

    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", loadAccountAndProjects);
      }
    };
  }, [loadAccountAndProjects]);

  // Handlers
  const handleConnect = loadAccountAndProjects;

  const handleCreate = async () => {
    if (!account) return alert("Connect wallet first");
    try {
      const sys = systemContract();
      const metadataURI = JSON.stringify({ name, description, location });
      const gas = await sys.methods.createProject(metadataURI).estimateGas({ from: account });
      await sys.methods.createProject(metadataURI).send({ from: account, gas });
      setOpenCreate(false);
      setName("");
      setDescription("");
      setLocation("");
      await loadProjects(account);
    } catch (err) {
      console.error("Create failed", err);
      alert(err.message);
    }
  };

  const handleRequestValidation = async (id) => {
    if (!account) return alert("Connect wallet first");
    try {
      const sys = systemContract();
      await sys.methods.requestValidation(id).send({ from: account });
      setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, status: "UnderReview" } : p)));
    } catch (err) {
      console.error("Request failed", err);
      alert(err.message);
    }
  };

  const handleFinalize = async (id) => {
    if (!account) return alert("Connect wallet first");
    try {
      const sys = systemContract();
      await sys.methods.finalizeValidation(id).send({ from: account });
      setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, status: "Finalized" } : p)));
      alert(`Project #${id} finalized.`);
    } catch (err) {
      console.error("Finalize failed", err);
      alert(err.message);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3} px={4}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <MDTypography variant="h4">My Carbon Projects</MDTypography>
          </Grid>
          <Grid item>
            {account ? (
              <>
                <Typography mr={2}>Connected: {account}</Typography>
                <Button variant="contained" onClick={() => setOpenCreate(true)}>
                  Create Project
                </Button>
              </>
            ) : (
              <Button variant="contained" onClick={handleConnect}>
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
                      <Typography color="textSecondary">{p.metadata.description}</Typography>
                      <Typography variant="caption" display="block" mt={1}>
                        Location: {p.metadata.location}
                      </Typography>
                      <Typography variant="caption" display="block" mt={1}>
                        Status: {p.status}
                      </Typography>
                      {p.status === "Finalized" && (
                        <Typography variant="caption" display="block">
                          Credits: {p.credits}
                        </Typography>
                      )}
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
                        {p.status === "Finalized" ? "Done" : "Finalize"}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </MDBox>

        <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
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
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={!name || !description || !location}
              variant="contained"
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}
