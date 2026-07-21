import { Box, Grid } from "@mui/material";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";

function Dashboard() {
  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />

      <Box sx={{ flexGrow: 1 }}>
        <Topbar />

        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <StatCard title="Total Sales" value="₹5,40,000" />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <StatCard title="Products" value="1,248" />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <StatCard title="Inventory" value="82%" />
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}

export default Dashboard;