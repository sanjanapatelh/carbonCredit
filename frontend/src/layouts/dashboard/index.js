// src/layouts/dashboard/Dashboard.js

import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ReportsLineChart from "examples/Charts/LineCharts/ReportsLineChart";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";

import { initWeb3, systemContract, tokenContract } from "../../ethereum";
import Projects from "layouts/dashboard/components/Projects";

function Dashboard() {
  const [totalCredits, setTotalCredits] = useState("0");
  const [totalProjects, setTotalProjects] = useState("0");
  const [totalTxs, setTotalTxs] = useState("0");

  useEffect(() => {
    (async () => {
      try {
        await initWeb3();

        // 1) Total carbon credits minted
        const token = tokenContract();
        const supply = await token.methods.totalSupply().call();
        setTotalCredits(supply);

        // 2) Total projects registered
        const sys = systemContract();
        const created = await sys.getPastEvents("ProjectCreated", {
          fromBlock: 0,
          toBlock: "latest",
        });
        setTotalProjects(String(created.length));

        // 3) Total "transactions" = sum of all contract events
        const [reqs, responses, finals, regs, slashes] = await Promise.all([
          sys.getPastEvents("ValidationRequested", { fromBlock: 0, toBlock: "latest" }),
          sys.getPastEvents("ValidatorResponded", { fromBlock: 0, toBlock: "latest" }),
          sys.getPastEvents("ValidationFinalized", { fromBlock: 0, toBlock: "latest" }),
          sys.getPastEvents("ValidatorRegistered", { fromBlock: 0, toBlock: "latest" }),
          sys.getPastEvents("ValidatorSlashed", { fromBlock: 0, toBlock: "latest" }),
        ]);

        const txCount =
          created.length +
          reqs.length +
          responses.length +
          finals.length +
          regs.length +
          slashes.length;

        setTotalTxs(String(txCount));
      } catch (err) {
        console.error("Dashboard init failed", err);
      }
    })();
  }, []);

  // Optional: line chart data if you have it
  const { sales, tasks } = { sales: [], tasks: [] };

  return (
    <DashboardLayout>
      <MDBox py={3}>
        <Grid container spacing={3}>
          {/* Total Emission Reduction */}
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="success"
                icon="eco"
                title="Total Emission Reduction"
                count={`${totalCredits} TCO2`}
                percentage={{
                  color: "success",
                  amount: `+0`,
                  label: "since genesis",
                }}
              />
            </MDBox>
          </Grid>
          {/* Total Ethereum Transactions (contract interactions) */}
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="info"
                icon="swap_horiz"
                title="Total Transactions Made"
                count={totalTxs}
                percentage={{
                  color: "success",
                  amount: "+0",
                  label: "since genesis",
                }}
              />
            </MDBox>
          </Grid>
          {/* Total Carbon Credits Minted */}
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="primary"
                icon="token"
                title="Total Carbon Credits"
                count={totalCredits}
                percentage={{
                  color: "info",
                  amount: "+0",
                  label: "since genesis",
                }}
              />
            </MDBox>
          </Grid>
          {/* Total Projects Registered */}
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="warning"
                icon="collections"
                title="Projects Registered"
                count={totalProjects}
                percentage={{
                  color: "success",
                  amount: "+0",
                  label: "since genesis",
                }}
              />
            </MDBox>
          </Grid>
        </Grid>

        <MDBox mt={4.5}>
          {/* (Optional) Line chart for trends */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={12} lg={12}>
              <MDBox mb={3}>
                <ReportsLineChart
                  color="success"
                  title="Total Emission Reduction Over Time"
                  description={
                    <>
                      (<strong>+0</strong>) since genesis.
                    </>
                  }
                  date="updated just now"
                  chart={{
                    labels: [], // your labels
                    datasets: { label: "TCO2", data: [] }, // your data
                  }}
                />
              </MDBox>
            </Grid>
          </Grid>
        </MDBox>

        <MDBox>
          <Grid container spacing={3}>
            <Grid item xs={12} md={12} lg={12}>
              <Projects />
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Dashboard;
