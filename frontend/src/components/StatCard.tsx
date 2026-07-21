import { Card, CardContent, Typography } from "@mui/material";

interface Props {
  title: string;
  value: number;
}

export default function StatCard({ title, value }: Props) {
  return (
    <Card sx={{ minWidth: 200 }}>
      <CardContent>
        <Typography variant="subtitle1">
          {title}
        </Typography>

        <Typography variant="h4">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}