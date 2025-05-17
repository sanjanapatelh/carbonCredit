// src/layouts/Customer/index.js

import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";

// MUI components
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";

// MUI icons
import Nature from "@mui/icons-material/Nature";
import HowToReg from "@mui/icons-material/HowToReg";
import Gavel from "@mui/icons-material/Gavel";
import LocationOn from "@mui/icons-material/LocationOnOutlined";
import Description from "@mui/icons-material/DescriptionOutlined";

// Layout wrappers
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Ethereum helpers
import { initWeb3, getAccounts, systemContract } from "../../ethereum";

// Status badge colors
const statusColor = {
  Created: "#0277bd",
  UnderReview: "#f57c00",
  Finalized: "#2e7d32",
};

// ——— ProjectCard ———
function ProjectCard({ project, onRequest, onFinalize }) {
  const { id, metadata, status, credits } = project;

  return (
    <Card
      sx={{
        backgroundColor: "rgba(17, 24, 39, 0.95)",
        borderRadius: "16px",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        transform: "scale(0.7)",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          transform: "scale(0.72)",
          boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.2)",
        },
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              background: "linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 4px 12px rgba(33,150,243,0.3)",
            }}
          >
            <Nature sx={{ fontSize: "1.2rem" }} />
          </Box>
          <Box textAlign="right">
            <Typography
              variant="h6"
              sx={{
                color: "#fff",
                fontWeight: 600,
                fontSize: "1.1rem",
                mb: 0.5,
                lineHeight: 1.2,
                textTransform: "capitalize",
              }}
            >
              {metadata.name}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.8rem", mb: 1 }}
            >
              ID: #{id}
            </Typography>
            <Box
              component="span"
              sx={{
                bgcolor:
                  status === "Finalized"
                    ? "rgba(76,175,80,0.15)"
                    : status === "UnderReview"
                    ? "rgba(255,152,0,0.15)"
                    : "rgba(33,150,243,0.15)",
                color:
                  status === "Finalized"
                    ? "#4caf50"
                    : status === "UnderReview"
                    ? "#ff9800"
                    : "#2196f3",
                px: 1.5,
                py: 0.5,
                borderRadius: "8px",
                fontSize: "0.75rem",
                fontWeight: 600,
                border: `1px solid ${
                  status === "Finalized"
                    ? "rgba(76,175,80,0.3)"
                    : status === "UnderReview"
                    ? "rgba(255,152,0,0.3)"
                    : "rgba(33,150,243,0.3)"
                }`,
              }}
            >
              {status === "Finalized" ? `${credits} Credits` : status}
            </Box>
          </Box>
        </Box>

        <Box sx={{ mt: 2, px: 1 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <Description sx={{ mr: 1.5, color: "#90caf9", fontSize: "1.1rem" }} />
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.9)", fontWeight: 500, lineHeight: 1.5 }}
            >
              {metadata.description}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <LocationOn sx={{ mr: 1.5, color: "#90caf9", fontSize: "1.1rem" }} />
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>
              {metadata.location}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" justifyContent="flex-end" gap={1.5} mt={2}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<HowToReg />}
            disabled={status !== "Created"}
            onClick={() => onRequest(id)}
            sx={{
              color: "#90caf9",
              borderColor: "rgba(144,202,249,0.5)",
              borderRadius: "8px",
              textTransform: "none",
              fontSize: "0.75rem",
            }}
          >
            Request Validation
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<Gavel />}
            disabled={status !== "UnderReview"}
            onClick={() => onFinalize(id)}
            sx={{
              background:
                status === "UnderReview"
                  ? "linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)"
                  : undefined,
              color: "#fff",
              borderRadius: "8px",
              textTransform: "none",
              fontSize: "0.75rem",
            }}
          >
            Finalize
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

ProjectCard.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.number.isRequired,
    metadata: PropTypes.shape({
      name: PropTypes.string,
      description: PropTypes.string,
      location: PropTypes.string,
    }).isRequired,
    status: PropTypes.oneOf(["Created", "UnderReview", "Finalized"]).isRequired,
    credits: PropTypes.number.isRequired,
  }).isRequired,
  onRequest: PropTypes.func.isRequired,
  onFinalize: PropTypes.func.isRequired,
};

export default function Customer() {
  const [account, setAccount] = useState("");
  const [projects, setProjects] = useState([]);

  // Create-Project dialog state
  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState("");
  const [descriptionText, setDescriptionText] = useState("");
  const [locationText, setLocationText] = useState("");

  // Load projects for this account only
  const loadProjects = async (acct) => {
    const sys = systemContract();
    // get all creations
    const created = await sys.getPastEvents("ProjectCreated", {
      fromBlock: 0,
      toBlock: "latest",
    });
    // filter to only those owned by this account
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

    // apply ValidationRequested
    const reqs = await sys.getPastEvents("ValidationRequested", {
      fromBlock: 0,
      toBlock: "latest",
    });
    const underReview = new Set(reqs.map((ev) => Number(ev.returnValues.projectId)));
    items = items.map((p) => ({
      ...p,
      status: underReview.has(p.id) ? "UnderReview" : p.status,
    }));

    // apply ValidationFinalized
    const finals = await sys.getPastEvents("ValidationFinalized", {
      fromBlock: 0,
      toBlock: "latest",
    });
    const creditMap = finals.reduce((m, ev) => {
      m[Number(ev.returnValues.projectId)] = Number(ev.returnValues.finalCredits);
      return m;
    }, {});
    items = items.map((p) => ({
      ...p,
      credits: creditMap[p.id] || 0,
      status: creditMap[p.id] != null ? "Finalized" : p.status,
    }));

    setProjects(items);
  };

  // connect wallet & fetch
  const loadAccountAndProjects = useCallback(async () => {
    await initWeb3();
    const accts = await getAccounts();
    if (accts.length) {
      setAccount(accts[0]);
      await loadProjects(accts[0]);
    }
  }, []);

  useEffect(() => {
    loadAccountAndProjects();
    if (window.ethereum && window.ethereum.on) {
      window.ethereum.on("accountsChanged", loadAccountAndProjects);
      return () => window.ethereum.removeListener("accountsChanged", loadAccountAndProjects);
    }
  }, [loadAccountAndProjects]);

  const handleCreate = async () => {
    if (!account) return alert("Connect wallet first");
    const sys = systemContract();
    const metadataURI = JSON.stringify({
      name,
      description: descriptionText,
      location: locationText,
    });
    try {
      const gas = await sys.methods.createProject(metadataURI).estimateGas({ from: account });
      await sys.methods.createProject(metadataURI).send({ from: account, gas });
      setOpenCreate(false);
      setName("");
      setDescriptionText("");
      setLocationText("");
      await loadProjects(account);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleRequest = async (id) => {
    if (!account) return alert("Connect wallet first");
    try {
      const sys = systemContract();
      await sys.methods.requestValidation(id).send({ from: account });
      await loadProjects(account);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleFinalize = async (id) => {
    if (!account) return alert("Connect wallet first");
    try {
      const sys = systemContract();
      await sys.methods.finalizeValidation(id).send({ from: account });
      await loadProjects(account);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <DashboardLayout>
      <Box p={4}>
        <Grid container justifyContent="space-between" alignItems="center">
          {!account ? (
            <Button
              variant="contained"
              onClick={loadAccountAndProjects}
              sx={{ backgroundColor: "#0288d1", color: "white" }}
            >
              Connect Wallet
            </Button>
          ) : (
            <>
              <Typography variant="h4" sx={{ color: "#fff", fontWeight: "bold" }}>
                My Carbon Projects
              </Typography>
              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  onClick={() => setOpenCreate(true)}
                  sx={{ backgroundColor: "#0288d1", color: "white" }}
                >
                  Create Project
                </Button>
                <Button
                  variant="outlined"
                  onClick={loadAccountAndProjects}
                  sx={{ color: "white", borderColor: "white" }}
                >
                  Refresh
                </Button>
              </Box>
            </>
          )}
        </Grid>

        <Grid container spacing={3} mt={2}>
          {projects.length === 0 && account && (
            <Grid item xs={12}>
              <Typography sx={{ color: "#b0bec5", fontWeight: "bold" }}>
                No projects yet.
              </Typography>
            </Grid>
          )}
          {projects.map((p) => (
            <Grid key={p.id} item xs={12} sm={6} md={4}>
              <ProjectCard project={p} onRequest={handleRequest} onFinalize={handleFinalize} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Create Project Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: "bold" }}>Create New Project</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Name"
            InputLabelProps={{ sx: { color: "#b0bec5", fontWeight: "bold" } }}
            InputProps={{ sx: { color: "white", fontWeight: "bold" } }}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Description"
            multiline
            rows={3}
            InputLabelProps={{ sx: { color: "#b0bec5", fontWeight: "bold" } }}
            InputProps={{ sx: { color: "white", fontWeight: "bold" } }}
            value={descriptionText}
            onChange={(e) => setDescriptionText(e.target.value)}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Location"
            InputLabelProps={{ sx: { color: "#b0bec5", fontWeight: "bold" } }}
            InputProps={{ sx: { color: "white", fontWeight: "bold" } }}
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            sx={{ color: "#b0bec5", fontWeight: "bold" }}
            onClick={() => setOpenCreate(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!name || !descriptionText || !locationText}
            sx={{ backgroundColor: "#0288d1", color: "white", fontWeight: "bold" }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
