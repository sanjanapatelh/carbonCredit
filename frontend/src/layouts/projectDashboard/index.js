// src/layouts/dashboard/ProjectDashboard.js

import React, { useState, useEffect, useCallback } from "react";
import Web3 from "web3";
import PropTypes from "prop-types";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

// Icons
import { Assessment, HowToReg, Gavel } from "@mui/icons-material";

// Layout
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Ethereum helpers
import { initWeb3, getAccounts, systemContract } from "../../ethereum";

export default function ProjectDashboard() {
  const [account, setAccount] = useState("");
  const [web3Instance, setWeb3Instance] = useState(null);

  // all pending validation requests
  const [requests, setRequests] = useState([]);
  const [validatorRegistered, setValidatorRegistered] = useState(false);

  // cache of project metadata
  const [projectsMeta, setProjectsMeta] = useState({});

  // detail modal state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [projectDetails, setProjectDetails] = useState(null);

  // register dialog state
  const [regDialogOpen, setRegDialogOpen] = useState(false);
  const [regAmount, setRegAmount] = useState("");

  // validation dialog state
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [currentReq, setCurrentReq] = useState(null);
  const [validationCredits, setValidationCredits] = useState("");

  // connect wallet + load metadata & registration
  const connectWallet = async () => {
    await initWeb3();
    const [acct] = await getAccounts();
    setAccount(acct);

    if (window.ethereum) setWeb3Instance(new Web3(window.ethereum));

    // check validator status
    try {
      const sys = systemContract();
      const info = await sys.methods.validators(acct).call();
      setValidatorRegistered(info.registered);
    } catch (err) {
      console.error(err);
    }

    // cache all project metadata
    try {
      const sys = systemContract();
      const evts = await sys.getPastEvents("ProjectCreated", {
        fromBlock: 0,
        toBlock: "latest",
      });
      const map = {};
      evts.forEach((ev) => {
        const id = Number(ev.returnValues.projectId);
        let meta = { name: "", description: "", location: "" };
        try {
          meta = JSON.parse(ev.returnValues.metadataURI);
        } catch {}
        map[id] = meta;
      });
      setProjectsMeta(map);
    } catch (err) {
      console.error(err);
    }
  };

  // load validation requests
  useEffect(() => {
    if (!account || !validatorRegistered) return;
    (async () => {
      const sys = systemContract();
      const evts = await sys.getPastEvents("ValidationRequested", {
        fromBlock: 0,
        toBlock: "latest",
      });
      const reqs = await Promise.all(
        evts.map(async (ev) => {
          const projectId = Number(ev.returnValues.projectId);
          const requester = ev.returnValues.owner;
          const resp = await sys.methods.responses(projectId, account).call();
          return {
            projectId,
            requester,
            responded: resp.responded,
            credits: resp.credits,
          };
        })
      );
      setRequests(reqs);
    })().catch(console.error);
  }, [account, validatorRegistered]);

  // open detail dialog
  const openDetailDialog = (req) => {
    const meta = projectsMeta[req.projectId] || {};
    setProjectDetails({
      projectId: req.projectId,
      owner: req.requester,
      ...meta,
      status: req.responded ? `Assigned ${req.credits}` : "Pending",
    });
    setDetailDialogOpen(true);
  };
  const closeDetailDialog = () => setDetailDialogOpen(false);

  // open register dialog
  const openRegDialog = () => {
    setRegAmount("");
    setRegDialogOpen(true);
  };
  const closeRegDialog = () => setRegDialogOpen(false);

  // handle registration
  const handleRegister = async () => {
    if (!account || !web3Instance) return;
    try {
      const sys = systemContract();
      const wei = web3Instance.utils.toWei(regAmount.toString(), "ether");
      const gas = await sys.methods.registerValidator().estimateGas({ from: account, value: wei });
      await sys.methods.registerValidator().send({ from: account, value: wei, gas });
      setValidatorRegistered(true);
      closeRegDialog();
      alert("Registered as validator!");
    } catch (err) {
      console.error(err);
      alert("Registration failed: " + err.message);
    }
  };

  // open assign‐credits dialog
  const openValidationDialog = (req) => {
    setCurrentReq(req);
    setValidationCredits("");
    setValidationDialogOpen(true);
  };
  const closeValidationDialog = () => setValidationDialogOpen(false);

  // submit validation
  const handleSubmitValidation = async () => {
    if (!validationCredits || !account) return;
    try {
      const sys = systemContract();
      const gas = await sys.methods
        .respondValidation(currentReq.projectId, validationCredits)
        .estimateGas({ from: account });
      await sys.methods
        .respondValidation(currentReq.projectId, validationCredits)
        .send({ from: account, gas });
      alert(`Assigned ${validationCredits} credits to project #${currentReq.projectId}`);
      // update local state
      setRequests((rs) =>
        rs.map((r) =>
          r.projectId === currentReq.projectId
            ? { ...r, responded: true, credits: validationCredits }
            : r
        )
      );
      closeValidationDialog();
    } catch (err) {
      console.error(err);
      alert("Validation failed: " + err.message);
    }
  };

  return (
    <DashboardLayout>
      <Box p={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" sx={{ color: "#fff", fontWeight: "bold" }}>
          Validation Dashboard
        </Typography>
        {!account ? (
          <Button variant="contained" color="info" onClick={connectWallet}>
            Connect Wallet
          </Button>
        ) : !validatorRegistered ? (
          <Button variant="contained" color="info" onClick={openRegDialog}>
            Register as Validator
          </Button>
        ) : null}
      </Box>

      <Box p={3}>
        <Grid container spacing={3}>
          {account && validatorRegistered && requests.length === 0 && (
            <Grid item xs={12}>
              <Typography sx={{ color: "#fff" }}>No pending requests.</Typography>
            </Grid>
          )}
          {account &&
            validatorRegistered &&
            requests.map((req) => (
              <Grid key={req.projectId} item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    backgroundColor: "rgba(17,24,39,0.95)",
                    borderRadius: 2,
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
                  <Box p={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          background: "linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)",
                          borderRadius: 1.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          boxShadow: "0 4px 12px rgba(33,150,243,0.3)",
                        }}
                      >
                        <Assessment />
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="h6" sx={{ color: "#fff", fontWeight: 600 }}>
                          {projectsMeta[req.projectId]?.name || `Project #${req.projectId}`}
                        </Typography>
                        <Box
                          component="span"
                          sx={{
                            backgroundColor: req.responded
                              ? "rgba(244,67,54,0.15)"
                              : "rgba(76,175,80,0.15)",
                            color: req.responded ? "#f44336" : "#4caf50",
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            border: req.responded
                              ? "1px solid rgba(244,67,54,0.3)"
                              : "1px solid rgba(76,175,80,0.3)",
                          }}
                        >
                          {req.responded ? `Assigned ${req.credits}` : "Pending"}
                        </Box>
                      </Box>
                    </Box>

                    <Box display="flex" justifyContent="flex-end" gap={1.5} mt={2}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<HowToReg />}
                        onClick={() => openDetailDialog(req)}
                        sx={{
                          color: "#90caf9",
                          borderColor: "rgba(144,202,249,0.5)",
                          textTransform: "none",
                        }}
                      >
                        View Details
                      </Button>
                      {!req.responded && (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<Gavel />}
                          onClick={() => openValidationDialog(req)}
                          sx={{
                            background: "linear-gradient(45deg,#4caf50 30%,#66bb6a 90%)",
                            textTransform: "none",
                          }}
                        >
                          Assign Credits
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
        </Grid>
      </Box>

      {/* Detail Modal */}
      <Dialog
        open={detailDialogOpen}
        onClose={closeDetailDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { backgroundColor: "rgba(17,24,39,0.95)", color: "#fff" } }}
      >
        <DialogTitle>Project Details</DialogTitle>
        <DialogContent>
          {projectDetails && (
            <Box>
              <Typography color="white">
                <strong>Name:</strong> {projectDetails.name}
              </Typography>
              <Typography color="white">
                <strong>Description:</strong> {projectDetails.description}
              </Typography>
              <Typography color="white">
                <strong>Location:</strong> {projectDetails.location}
              </Typography>
              <Typography color="white">
                <strong>Status:</strong> {projectDetails.status}
              </Typography>
              <Typography color="white">
                <strong>Owner:</strong> {projectDetails.owner}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetailDialog} sx={{ color: "#fff" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Register Modal */}
      <Dialog open={regDialogOpen} onClose={closeRegDialog} fullWidth maxWidth="sm">
        <DialogTitle>Register as Validator</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="number"
            label="Stake Amount (ETH)"
            value={regAmount}
            onChange={(e) => setRegAmount(e.target.value)}
            InputLabelProps={{ sx: { color: "#b0bec5" } }}
            InputProps={{ sx: { color: "#fff" } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRegDialog} sx={{ color: "#fff" }}>
            Cancel
          </Button>
          <Button onClick={handleRegister} disabled={!regAmount} variant="contained" color="info">
            Register
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Credits Modal */}
      <Dialog open={validationDialogOpen} onClose={closeValidationDialog} fullWidth maxWidth="sm">
        <DialogTitle>Assign Credits</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="number"
            label="Credits"
            value={validationCredits}
            onChange={(e) => setValidationCredits(e.target.value)}
            InputLabelProps={{ sx: { color: "#b0bec5" } }}
            InputProps={{ sx: { color: "#fff" } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeValidationDialog} sx={{ color: "#fff" }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitValidation}
            disabled={!validationCredits}
            variant="contained"
            color="success"
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}

ProjectDashboard.propTypes = {
  // no props
};
