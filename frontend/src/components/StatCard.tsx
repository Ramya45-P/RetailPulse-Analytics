import { Card, CardContent, Typography, Box } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

interface Props {
  title: string;
  value: string;
}

function StatCard({ title, value }: Props) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: 4,
        transition: "0.3s",
        "&:hover": {
          transform: "translateY(-5px)",
        },
      }}
    >
      <CardContent>
       <Box
         sx={{
           display: "flex",
           justifyContent: "space-between",
           alignItems: "center",
     }}
   >
          <Box>
            <Typography color="text.secondary">{title}</Typography>
           <Typography
             variant="h5"
             sx={{ fontWeight: "bold" }}
     >
              {value}
            </Typography>
          </Box>

          <TrendingUpIcon color="primary" sx={{ fontSize: 40 }} />
        </Box>
      </CardContent>
    </Card>
  );
}

export default StatCard;