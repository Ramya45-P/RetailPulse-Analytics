import {
  Card,
  CardContent,
  Typography
} from "@mui/material";


interface DashboardCardProps {
  title: string;
  value: number;
}


export default function DashboardCard({
  title,
  value
}: DashboardCardProps) {

  return (

    <Card
      sx={{
        borderRadius: 3,
        boxShadow: 3,
        height: "100%"
      }}
    >

      <CardContent>

        <Typography
          variant="subtitle2"
          color="text.secondary"
        >
          {title}
        </Typography>


        <Typography
          variant="h4"
          fontWeight="bold"
          mt={1}
        >
          {value}
        </Typography>


      </CardContent>

    </Card>

  );

}