// src/layouts/dashboard/ProjectDashboard.js

import React, { useState, useEffect } from "react";
import Web3 from "web3";
// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Avatar from "@mui/material/Avatar";

// Layout
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Ethereum helpers
import { initWeb3, getAccounts, systemContract } from "../../ethereum";

function ProjectDashboard() {
  const [account, setAccount] = useState("");
  const [web3Instance, setWeb3Instance] = useState(null);
  const [requests, setRequests] = useState([]);
  const [validatorRegistered, setValidatorRegistered] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [isRegisterFlow, setIsRegisterFlow] = useState(false);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [currentReq, setCurrentReq] = useState(null);
  const [validationCredits, setValidationCredits] = useState("");
  const [projectDetails, setProjectDetails] = useState(null);

  // connect wallet
  const connectWallet = async () => {
    await initWeb3();
    const [acct] = await getAccounts();
    setAccount(acct);
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      setWeb3Instance(web3);
    }
    // check registration
    try {
      const sys = systemContract();
      const info = await sys.methods.validators(acct).call();
      setValidatorRegistered(info.registered);
    } catch (err) {
      console.error(err);
    }
  };

  // fetch validation requests and response status
  useEffect(() => {
    if (!account || !validatorRegistered) return;
    (async () => {
      try {
        const sys = systemContract();
        const events = await sys.getPastEvents("ValidationRequested", {
          fromBlock: 0,
          toBlock: "latest",
        });
        const reqs = await Promise.all(
          events.map(async (ev) => {
            const projectId = ev.returnValues.projectId;
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
      } catch (err) {
        console.error(err);
      }
    })();
  }, [account, validatorRegistered]);

  // modal handlers for register/stake
  const openRegisterDialog = (register) => {
    setIsRegisterFlow(register);
    setAmount("");
    setDialogOpen(true);
  };
  const closeDialog = () => setDialogOpen(false);

  // view details handler
  const openDetailDialog = async (req) => {
    setCurrentReq(req);
    try {
      const sys = systemContract();
      const details = await sys.methods.projects(req.projectId).call();
      setProjectDetails(details);
    } catch (err) {
      console.error(err);
      setProjectDetails(null);
    }
    setDetailDialogOpen(true);
  };
  const closeDetailDialog = () => setDetailDialogOpen(false);

  const handleConfirm = async () => {
    if (!amount || !account || !web3Instance) return;
    try {
      const sys = systemContract();
      const wei = web3Instance.utils.toWei(amount.toString(), "ether");
      const valueHex = web3Instance.utils.toHex(wei);
      const method = isRegisterFlow ? sys.methods.registerValidator() : sys.methods.stake();
      const gas = await method.estimateGas({ from: account, value: valueHex });
      await method.send({ from: account, value: valueHex, gas });
      setValidatorRegistered(true);
      closeDialog();
      alert(`${isRegisterFlow ? "Registered" : "Staked"} successfully for ${amount} ETH.`);
    } catch (err) {
      console.error("Register/Stake error data:", err.data || err);
      const message = err.data?.message || err.message || "Transaction reverted";
      alert(`Transaction failed: ${message}`);
    }
  };

  // validation handlers
  const openValidationDialog = (req) => {
    setCurrentReq(req);
    setValidationCredits("");
    setValidationDialogOpen(true);
  };
  const closeValidationDialog = () => setValidationDialogOpen(false);

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
      setRequests((reqs) =>
        reqs.map((r) =>
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
      <DashboardNavbar />
      <MDBox p={3} pb={1} display="flex" justifyContent="space-between" alignItems="center">
        <MDTypography variant="h4" fontWeight="bold">
          Validation Dashboard
        </MDTypography>
        {!account ? (
          <MDButton variant="contained" color="primary" onClick={connectWallet}>
            Connect Wallet
          </MDButton>
        ) : !validatorRegistered ? (
          <MDButton variant="contained" color="primary" onClick={() => openRegisterDialog(true)}>
            Register as Validator
          </MDButton>
        ) : null}
      </MDBox>

      <MDBox p={3}>
        <Grid container spacing={3}>
          {account &&
            validatorRegistered &&
            (requests.length ? (
              requests.map((req) => (
                <Grid key={req.projectId} item xs={12} sm={6} md={4}>
                  <Card>
                    <MDBox display="flex" alignItems="center" p={2}>
                      <Avatar src="/logo192.png" sx={{ width: 48, height: 48, mr: 2 }} />
                      <MDBox>
                        <MDTypography variant="h6">Project #{req.projectId}</MDTypography>
                        <MDTypography variant="caption">Requested by {req.requester}</MDTypography>
                      </MDBox>
                    </MDBox>
                    <MDBox p={2} pt={0} display="flex" justifyContent="space-between">
                      <MDButton
                        size="small"
                        variant="outlined"
                        onClick={() => openDetailDialog(req)}
                      >
                        View Details
                      </MDButton>
                      {req.responded ? (
                        <MDButton size="small" variant="contained" color="error" disabled>
                          Assigned: {req.credits}
                        </MDButton>
                      ) : (
                        <MDButton
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => openValidationDialog(req)}
                        >
                          Assign Credits
                        </MDButton>
                      )}
                    </MDBox>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <MDTypography>No pending requests.</MDTypography>
              </Grid>
            ))}
        </Grid>
      </MDBox>

      {/* Detail Modal */}
      <Dialog open={detailDialogOpen} onClose={closeDetailDialog} fullWidth maxWidth="sm">
        <DialogTitle>Project Details #{currentReq?.projectId}</DialogTitle>
        <DialogContent>
          {projectDetails ? (
            <MDBox>
              <MDTypography>
                <strong>Owner:</strong> {projectDetails.owner}
              </MDTypography>
              <MDTypography>
                <strong>Status:</strong> {projectDetails.status}
              </MDTypography>
              <MDTypography>
                <strong>Metadata URI:</strong> {projectDetails.metadataURI}
              </MDTypography>
            </MDBox>
          ) : (
            <MDTypography>Loading...</MDTypography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetailDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Register/Stake Modal */}
      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{isRegisterFlow ? "Register as Validator" : "Stake More ETH"}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="number"
            label="Amount (ETH)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!amount} variant="contained" color="primary">
            {isRegisterFlow ? "Register" : "Stake"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Validation Modal */}
      <Dialog open={validationDialogOpen} onClose={closeValidationDialog} fullWidth maxWidth="sm">
        <DialogTitle>Assign Credits to Project #{currentReq?.projectId}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="number"
            label="Credits"
            value={validationCredits}
            onChange={(e) => setValidationCredits(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeValidationDialog}>Cancel</Button>
          <Button
            onClick={handleSubmitValidation}
            disabled={!validationCredits}
            variant="contained"
            color="primary"
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* <Footer /> */}
    </DashboardLayout>
  );
}

export default ProjectDashboard;
