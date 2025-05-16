/* eslint-disable react/prop-types */
/* eslint-disable react/function-component-definition */
/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// @mui material components
import Tooltip from "@mui/material/Tooltip";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDAvatar from "components/MDAvatar";
import MDProgress from "components/MDProgress";

// Images
import logoXD from "assets/images/small-logos/logo-xd.svg";
import logoAtlassian from "assets/images/small-logos/logo-atlassian.svg";
import logoSlack from "assets/images/small-logos/logo-slack.svg";
import logoSpotify from "assets/images/small-logos/logo-spotify.svg";
import logoJira from "assets/images/small-logos/logo-jira.svg";
import logoInvesion from "assets/images/small-logos/logo-invision.svg";
import team1 from "assets/images/team-1.jpg";
import team2 from "assets/images/team-2.jpg";
import team3 from "assets/images/team-3.jpg";
import team4 from "assets/images/team-4.jpg";

export default function data() {
  const avatars = (members) =>
    members.map(([image, name]) => (
      <Tooltip key={name} title={name} placeholder="bottom">
        <MDAvatar
          src={image}
          alt="name"
          size="xs"
          sx={{
            border: ({ borders: { borderWidth }, palette: { white } }) =>
              `${borderWidth[2]} solid ${white.main}`,
            cursor: "pointer",
            position: "relative",

            "&:not(:first-of-type)": {
              ml: -1.25,
            },

            "&:hover, &:focus": {
              zIndex: "10",
            },
          }}
        />
      </Tooltip>
    ));

  const Company = ({ image, name }) => (
    <MDBox display="flex" alignItems="center" lineHeight={1}>
      <MDAvatar src={image} name={name} size="sm" />
      <MDTypography variant="button" fontWeight="medium" ml={1} lineHeight={1}>
        {name}
      </MDTypography>
    </MDBox>
  );

  return {
    columns: [
      { Header: "Project Name", accessor: "project", align: "left" },
      { Header: "Location", accessor: "location", align: "left" },
      { Header: "Status", accessor: "status", align: "center" },
      { Header: "Timestamp", accessor: "timestamp", align: "center" },
    ],
    rows: [
      {
        project: "Rainforest",
        location: (
          <MDBox display="flex" alignItems="center">
            <img
              src="https://flagcdn.com/br.svg"
              alt="Brazil"
              width="24"
              style={{ marginRight: 8 }}
            />
            Brazil
          </MDBox>
        ),
        status: "Forestry",
        timestamp: "08 May 2025, 10:42 AM",
      },
      {
        project: "SolarLoop",
        location: (
          <MDBox display="flex" alignItems="center">
            <img
              src="https://flagcdn.com/ke.svg"
              alt="Kenya"
              width="24"
              style={{ marginRight: 8 }}
            />
            Kenya
          </MDBox>
        ),
        status: "Solar PV",
        timestamp: "08 May 2025, 06:17 AM",
      },
      {
        project: "Reforestation",
        location: (
          <MDBox display="flex" alignItems="center">
            <img
              src="https://flagcdn.com/pe.svg"
              alt="Peru"
              width="24"
              style={{ marginRight: 8 }}
            />
            Peru
          </MDBox>
        ),
        status: "Forestry",
        timestamp: "08 May 2025, 08:55 AM",
      },
      {
        project: "BioChar",
        location: (
          <MDBox display="flex" alignItems="center">
            <img
              src="https://flagcdn.com/de.svg"
              alt="Germany"
              width="24"
              style={{ marginRight: 8 }}
            />
            Germany
          </MDBox>
        ),
        status: "Agriculture",
        timestamp: "08 May 2025, 06:12 AM",
      },
    ],
  };
}
