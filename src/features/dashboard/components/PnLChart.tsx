import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { PnlDataPoint } from '@/types/database'
import { format } from 'date-fns'

interface PnLChartProps {
  data: PnlDataPoint[]
}

export function PnLChart({ data }: PnLChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    date: format(new Date(d.date), 'dd/MM'),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Biểu đồ Lợi nhuận / Thua lỗ</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="dollars">
          <TabsList className="mb-4">
            <TabsTrigger value="dollars">USD ($)</TabsTrigger>
            <TabsTrigger value="pips">Pips</TabsTrigger>
          </TabsList>

          <TabsContent value="dollars">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cumulativePnlDollars"
                  name="Tích luỹ PnL ($)"
                  stroke="var(--profit)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="pnlDollars"
                  name="PnL ($)"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="pips">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cumulativePnlPips"
                  name="Tích luỹ Pips"
                  stroke="var(--profit)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="pnlPips"
                  name="Pips"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
